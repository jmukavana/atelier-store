VALID_SHIPPING = {
    "email": "buyer@example.com",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "address": "12 Engine Way",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "country": "UK",
}


async def register(client, email):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "correct-horse-battery",
            "first_name": "Regular",
            "last_name": "User",
        },
    )


# --- Access control -------------------------------------------------------


async def test_admin_routes_require_auth(client):
    assert (await client.get("/api/v1/admin/stats")).status_code == 401
    assert (await client.get("/api/v1/admin/products")).status_code == 401


async def test_admin_routes_reject_non_admin_users(client):
    await register(client, "shopper@example.com")
    assert (await client.get("/api/v1/admin/stats")).status_code == 403
    assert (await client.get("/api/v1/admin/orders")).status_code == 403


async def test_admin_routes_allow_admin_users(admin_client):
    response = await admin_client.get("/api/v1/admin/stats")
    assert response.status_code == 200


# --- Products ---------------------------------------------------------------


async def test_admin_can_create_list_update_and_delete_a_product(admin_client):
    create = await admin_client.post(
        "/api/v1/admin/products",
        json={
            "slug": "admin-test-scarf",
            "name": "Admin Test Scarf",
            "category": "accessories",
            "price": 120,
            "description": "A scarf created via the admin API.",
            "details": ["100% test wool"],
            "sizes": ["One Size"],
            "mark": "T",
        },
    )
    assert create.status_code == 201
    product_id = create.json()["id"]

    listed = await admin_client.get("/api/v1/admin/products?search=Admin Test")
    assert listed.status_code == 200
    assert listed.json()["total"] == 1

    updated = await admin_client.patch(
        f"/api/v1/admin/products/{product_id}", json={"price": 150}
    )
    assert updated.status_code == 200
    assert updated.json()["price"] == 150
    # Untouched fields survive a partial update.
    assert updated.json()["name"] == "Admin Test Scarf"

    deleted = await admin_client.delete(f"/api/v1/admin/products/{product_id}")
    assert deleted.status_code == 204

    missing = await admin_client.get(f"/api/v1/admin/products/{product_id}")
    assert missing.status_code == 404


async def test_admin_create_product_rejects_duplicate_slug(admin_client, sample_product):
    response = await admin_client.post(
        "/api/v1/admin/products",
        json={
            "slug": sample_product.slug,
            "name": "Duplicate",
            "category": "accessories",
            "price": 100,
            "description": "x",
            "sizes": ["One Size"],
            "mark": "D",
        },
    )
    assert response.status_code == 409


async def test_admin_update_product_can_clear_compare_at_price(admin_client, sample_product):
    await admin_client.patch(
        f"/api/v1/admin/products/{sample_product.id}", json={"compare_at_price": 999}
    )
    cleared = await admin_client.patch(
        f"/api/v1/admin/products/{sample_product.id}", json={"compare_at_price": None}
    )
    assert cleared.status_code == 200
    assert cleared.json()["compare_at_price"] is None


# --- Orders and customers ------------------------------------------------


async def test_admin_sees_every_order_not_just_their_own(
    client, admin_client, sample_product
):
    await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )

    response = await admin_client.get("/api/v1/admin/orders")
    assert response.status_code == 200
    assert response.json()["total"] == 1

    order_id = response.json()["items"][0]["id"]
    detail = await admin_client.get(f"/api/v1/admin/orders/{order_id}")
    assert detail.status_code == 200


async def test_admin_can_list_users(admin_client, another_client):
    # Registering via a *different* client — reusing admin_client here would
    # overwrite its session cookie with the new (non-admin) user's.
    await register(another_client, "another-shopper@example.com")
    response = await admin_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    # admin + the registered shopper
    assert response.json()["total"] == 2


async def test_admin_can_list_newsletter_subscribers(admin_client):
    await admin_client.post(
        "/api/v1/newsletter", json={"email": "subscriber@example.com"}
    )
    response = await admin_client.get("/api/v1/admin/newsletter")
    assert response.status_code == 200
    assert [s["email"] for s in response.json()] == ["subscriber@example.com"]


# --- Finance ----------------------------------------------------------------


async def test_finance_summary_reflects_paid_orders_only(
    client, admin_client, sample_product
):
    await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 2}],
        },
    )

    summary = await admin_client.get("/api/v1/admin/finance/summary")
    assert summary.status_code == 200
    body = summary.json()
    # No Stripe configured in tests -> the order is paid immediately.
    assert body["paid_order_count"] == 1
    assert body["total_revenue"] == sample_product.price * 2
    assert body["average_order_value"] == sample_product.price * 2
    assert body["pending_payment_count"] == 0


async def test_revenue_by_category_groups_paid_order_items(
    client, admin_client, sample_product
):
    await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 3}],
        },
    )

    response = await admin_client.get("/api/v1/admin/finance/revenue-by-category")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["category"] == sample_product.category
    assert body[0]["revenue"] == sample_product.price * 3
    assert body[0]["quantity"] == 3


async def test_transactions_list_reports_payment_method(
    client, admin_client, sample_product
):
    await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )

    response = await admin_client.get("/api/v1/admin/finance/transactions")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["payment_method"] == "demo"
    assert body["items"][0]["status"] == "paid"


async def test_revenue_series_is_empty_with_no_paid_orders(admin_client):
    response = await admin_client.get("/api/v1/admin/finance/revenue")
    assert response.status_code == 200
    assert response.json() == []
