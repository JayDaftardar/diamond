"""Errors that map to a specific form field (returned as 422 {"errors": {field: message}})."""


class FieldError(Exception):
    def __init__(self, field: str, message: str):
        super().__init__(message)
        self.field = field
        self.message = message
