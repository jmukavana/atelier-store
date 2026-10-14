VALID_SHIPPING = {
    "email": "buyer@example.com",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "address": "12 Engine Way",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "country": "UK",
}


async def test_create_order_prices_from_server_not_client(client, sample_product):
    response = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 2}],
        },
    )
    assert response.status_code == 201
    body = response.json()
    # 890 * 2, from the product row, never from the (nonexistent) request price
    assert body["order"]["subtotal"] == 1780
    assert body["order"]["total"] == 1780
    assert body["order"]["items"][0]["price"] == 890


async def test_create_order_with_no_stripe_configured_is_paid_immediately(
    client, sample_product
):
    # Tests run with no STRIPE_SECRET_KEY set — the fallback path.
    response = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )
    body = response.json()
    assert body["checkout_url"] is None
    assert body["order"]["status"] == "paid"


async def test_create_order_rejects_unknown_product(client):
    response = await client.post(
        "/api/v1/orders",
        json={**VALID_SHIPPING, "items": [{"slug": "no-such-product", "size": "M", "quantity": 1}]},
    )
    assert response.status_code == 400


async def test_create_order_rejects_invalid_size(client, sample_product):
    response = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "XXL", "quantity": 1}],
        },
    )
    assert response.status_code == 400


async def test_create_order_rejects_invalid_email(client, sample_product):
    response = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "email": "not-an-email",
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )
    assert response.status_code == 422


async def test_get_order_round_trips(client, sample_product):
    created = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )
    order_id = created.json()["order"]["id"]

    fetched = await client.get(f"/api/v1/orders/{order_id}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == order_id


async def test_get_order_not_found(client):
    response = await client.get("/api/v1/orders/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


async def test_order_placed_while_logged_in_is_linked_to_the_user(client, sample_product):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner@example.com",
            "password": "correct-horse-battery",
            "first_name": "Ada",
            "last_name": "Lovelace",
        },
    )
    created = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )
    me = await client.get("/api/v1/auth/me")
    assert created.json()["order"]["user_id"] == me.json()["id"]


async def test_guest_order_has_no_owner(client, sample_product):
    created = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )
    assert created.json()["order"]["user_id"] is None


async def test_other_users_cannot_view_someone_elses_order(
    client, another_client, sample_product
):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "owner2@example.com",
            "password": "correct-horse-battery",
            "first_name": "Ada",
            "last_name": "Lovelace",
        },
    )
    created = await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )
    order_id = created.json()["order"]["id"]

    # A different, unauthenticated visitor can't see it either
    anon_response = await another_client.get(f"/api/v1/orders/{order_id}")
    assert anon_response.status_code == 403

    # Nor can a different logged-in user
    await another_client.post(
        "/api/v1/auth/register",
        json={
            "email": "someone-else@example.com",
            "password": "correct-horse-battery",
            "first_name": "Bob",
            "last_name": "Someone",
        },
    )
    other_user_response = await another_client.get(f"/api/v1/orders/{order_id}")
    assert other_user_response.status_code == 403

    # The owner can still see their own order
    owner_response = await client.get(f"/api/v1/orders/{order_id}")
    assert owner_response.status_code == 200


async def test_list_my_orders_requires_auth(client):
    response = await client.get("/api/v1/orders/me")
    assert response.status_code == 401


async def test_list_my_orders_returns_only_own_orders(
    client, another_client, sample_product
):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "shopper1@example.com",
            "password": "correct-horse-battery",
            "first_name": "Ada",
            "last_name": "Lovelace",
        },
    )
    await client.post(
        "/api/v1/orders",
        json={
            **VALID_SHIPPING,
            "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
        },
    )

    await another_client.post(
        "/api/v1/auth/register",
        json={
            "email": "shopper2@example.com",
            "password": "correct-horse-battery",
            "first_name": "Bob",
            "last_name": "Someone",
        },
    )

    mine = await client.get("/api/v1/orders/me")
    assert mine.status_code == 200
    assert len(mine.json()) == 1

    theirs = await another_client.get("/api/v1/orders/me")
    assert theirs.status_code == 200
    assert theirs.json() == []
