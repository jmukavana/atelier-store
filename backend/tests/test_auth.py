VALID_USER = {
    "email": "shopper@example.com",
    "password": "correct-horse-battery",
    "first_name": "Grace",
    "last_name": "Hopper",
}


async def test_register_sets_session_cookie_and_returns_user(client):
    response = await client.post("/api/v1/auth/register", json=VALID_USER)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == VALID_USER["email"]
    assert "hashed_password" not in body
    assert "atelier_session" in response.cookies


async def test_register_rejects_duplicate_email(client):
    await client.post("/api/v1/auth/register", json=VALID_USER)
    response = await client.post("/api/v1/auth/register", json=VALID_USER)
    assert response.status_code == 409


async def test_login_with_correct_credentials(client):
    await client.post("/api/v1/auth/register", json=VALID_USER)
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert response.status_code == 200
    assert "atelier_session" in response.cookies


async def test_login_with_wrong_password_is_rejected(client):
    await client.post("/api/v1/auth/register", json=VALID_USER)
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_USER["email"], "password": "wrong password"},
    )
    assert response.status_code == 401


async def test_me_requires_authentication(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401


async def test_me_returns_current_user_after_login(client):
    await client.post("/api/v1/auth/register", json=VALID_USER)
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == VALID_USER["email"]


async def test_logout_clears_session(client):
    await client.post("/api/v1/auth/register", json=VALID_USER)
    logout = await client.post("/api/v1/auth/logout")
    assert logout.status_code == 204

    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 401
