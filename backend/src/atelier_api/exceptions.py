class AppError(Exception):
    """Base class for domain errors that map to a specific HTTP response."""

    status_code: int = 400

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


class NotFoundError(AppError):
    status_code = 404


class ProductNotFoundError(NotFoundError):
    pass


class OrderNotFoundError(NotFoundError):
    pass


class ConflictError(AppError):
    status_code = 409


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403
