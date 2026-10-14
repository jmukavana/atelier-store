async def test_subscribe(client):
    response = await client.post(
        "/api/v1/newsletter", json={"email": "subscriber@example.com"}
    )
    assert response.status_code == 201
    assert response.json() == {"email": "subscriber@example.com", "subscribed": True}


async def test_subscribe_is_idempotent(client):
    payload = {"email": "repeat@example.com"}
    first = await client.post("/api/v1/newsletter", json=payload)
    second = await client.post("/api/v1/newsletter", json=payload)
    assert first.status_code == 201
    assert second.status_code == 201


async def test_subscribe_rejects_invalid_email(client):
    response = await client.post("/api/v1/newsletter", json={"email": "nope"})
    assert response.status_code == 422
