async def test_list_products_empty(client):
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    body = response.json()
    assert body == {"items": [], "total": 0, "limit": 24, "offset": 0}


async def test_get_product_by_slug(client, sample_product):
    response = await client.get(f"/api/v1/products/{sample_product.slug}")
    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == sample_product.slug
    assert body["price"] == 890
    assert body["is_new"] is True


async def test_get_product_not_found(client):
    response = await client.get("/api/v1/products/does-not-exist")
    assert response.status_code == 404


async def test_list_products_filters_by_category(client, sample_product):
    matching = await client.get("/api/v1/products?category=outerwear")
    assert matching.json()["total"] == 1

    non_matching = await client.get("/api/v1/products?category=knitwear")
    assert non_matching.json()["total"] == 0


async def test_categories_endpoint(client):
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    values = {c["value"] for c in response.json()}
    assert values == {"outerwear", "tailoring", "knitwear", "accessories"}
