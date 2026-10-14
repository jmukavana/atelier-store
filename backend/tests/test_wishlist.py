async def register(client, email):
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "correct-horse-battery",
            "first_name": "Ada",
            "last_name": "Lovelace",
        },
    )


async def test_wishlist_requires_auth(client, sample_product):
    response = await client.get("/api/v1/wishlist")
    assert response.status_code == 401

    response = await client.post(f"/api/v1/wishlist/{sample_product.slug}")
    assert response.status_code == 401


async def test_add_list_and_remove(client, sample_product):
    await register(client, "wishlister@example.com")

    add_response = await client.post(f"/api/v1/wishlist/{sample_product.slug}")
    assert add_response.status_code == 204

    listed = await client.get("/api/v1/wishlist")
    assert listed.status_code == 200
    assert [p["slug"] for p in listed.json()] == [sample_product.slug]

    slugs = await client.get("/api/v1/wishlist/slugs")
    assert slugs.json() == [sample_product.slug]

    remove_response = await client.delete(f"/api/v1/wishlist/{sample_product.slug}")
    assert remove_response.status_code == 204

    listed_again = await client.get("/api/v1/wishlist")
    assert listed_again.json() == []


async def test_adding_twice_is_idempotent(client, sample_product):
    await register(client, "repeat-wishlister@example.com")

    first = await client.post(f"/api/v1/wishlist/{sample_product.slug}")
    second = await client.post(f"/api/v1/wishlist/{sample_product.slug}")
    assert first.status_code == 204
    assert second.status_code == 204

    listed = await client.get("/api/v1/wishlist")
    assert len(listed.json()) == 1


async def test_add_unknown_product_404s(client):
    await register(client, "wishlister2@example.com")
    response = await client.post("/api/v1/wishlist/no-such-product")
    assert response.status_code == 404


async def test_wishlist_is_per_user(client, another_client, sample_product):
    await register(client, "wishlister3@example.com")
    await register(another_client, "wishlister4@example.com")

    await client.post(f"/api/v1/wishlist/{sample_product.slug}")

    mine = await client.get("/api/v1/wishlist")
    theirs = await another_client.get("/api/v1/wishlist")
    assert len(mine.json()) == 1
    assert theirs.json() == []
