"""Tests for the payments price parsing utility."""


from app.api.v1.routers.payments import _parse_price_to_cents


class TestParsePriceToCents:
    """Unit tests for _parse_price_to_cents."""

    def test_none_returns_zero(self):
        assert _parse_price_to_cents(None) == 0

    def test_empty_string_returns_zero(self):
        assert _parse_price_to_cents("") == 0

    def test_simple_us_format(self):
        assert _parse_price_to_cents("299.99") == 29999

    def test_with_euro_symbol(self):
        assert _parse_price_to_cents("€299.99") == 29999

    def test_with_dollar_symbol(self):
        assert _parse_price_to_cents("$49.99") == 4999

    def test_european_format_with_comma(self):
        assert _parse_price_to_cents("€1.299,99") == 129999

    def test_european_format_simple(self):
        assert _parse_price_to_cents("29,99") == 2999

    def test_integer_price(self):
        assert _parse_price_to_cents("€100") == 10000

    def test_invalid_string_returns_zero(self):
        assert _parse_price_to_cents("free") == 0
