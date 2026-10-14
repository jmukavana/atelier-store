from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

VALID_SHIPPING = {
    "email": "buyer@example.com",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "address": "12 Engine Way",
    "city": "London",
    "postal_code": "SW1A 1AA",
    "country": "UK",
}

FAKE_SESSION = SimpleNamespace(
    id="cs_test_123", url="https://checkout.stripe.com/pay/cs_test_123"
)


async def test_create_order_uses_stripe_when_configured(client, sample_product):
    with (
        patch("atelier_api.crud.order.stripe_enabled", return_value=True),
        patch(
            "stripe.checkout.Session.create_async",
            new=AsyncMock(return_value=FAKE_SESSION),
        ) as create_mock,
    ):
        response = await client.post(
            "/api/v1/orders",
            json={
                **VALID_SHIPPING,
                "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
            },
        )

    body = response.json()
    assert body["checkout_url"] == FAKE_SESSION.url
    assert body["order"]["status"] == "pending_payment"
    create_mock.assert_awaited_once()

    # Client never sees prices we didn't compute — verify the line item
    # Stripe was actually charged reflects our DB price, not a client one.
    line_items = create_mock.await_args.kwargs["line_items"]
    assert line_items[0]["price_data"]["unit_amount"] == sample_product.price * 100


async def test_get_order_reconciles_with_stripe_once_paid(client, sample_product):
    with (
        patch("atelier_api.crud.order.stripe_enabled", return_value=True),
        patch(
            "stripe.checkout.Session.create_async",
            new=AsyncMock(return_value=FAKE_SESSION),
        ),
    ):
        created = await client.post(
            "/api/v1/orders",
            json={
                **VALID_SHIPPING,
                "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
            },
        )
    order_id = created.json()["order"]["id"]

    with (
        patch("atelier_api.crud.order.stripe_enabled", return_value=True),
        patch(
            "stripe.checkout.Session.retrieve_async",
            new=AsyncMock(return_value=SimpleNamespace(payment_status="paid")),
        ) as retrieve_mock,
    ):
        fetched = await client.get(f"/api/v1/orders/{order_id}")

    assert fetched.json()["status"] == "paid"
    retrieve_mock.assert_awaited_once_with(FAKE_SESSION.id)


async def test_get_order_stays_pending_if_stripe_not_yet_paid(client, sample_product):
    with (
        patch("atelier_api.crud.order.stripe_enabled", return_value=True),
        patch(
            "stripe.checkout.Session.create_async",
            new=AsyncMock(return_value=FAKE_SESSION),
        ),
    ):
        created = await client.post(
            "/api/v1/orders",
            json={
                **VALID_SHIPPING,
                "items": [{"slug": sample_product.slug, "size": "44", "quantity": 1}],
            },
        )
    order_id = created.json()["order"]["id"]

    with (
        patch("atelier_api.crud.order.stripe_enabled", return_value=True),
        patch(
            "stripe.checkout.Session.retrieve_async",
            new=AsyncMock(return_value=SimpleNamespace(payment_status="unpaid")),
        ),
    ):
        fetched = await client.get(f"/api/v1/orders/{order_id}")

    assert fetched.json()["status"] == "pending_payment"
