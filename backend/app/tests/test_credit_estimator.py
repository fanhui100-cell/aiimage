from app.services.credit_estimator import estimate_credits

def test_text_only_costs_1_credit():
    assert estimate_credits(has_reference_image=False) == 1

def test_with_reference_image_costs_2_credits():
    assert estimate_credits(has_reference_image=True) == 2

def test_large_size_costs_extra():
    small = estimate_credits(has_reference_image=False, size="1024x1024")
    large = estimate_credits(has_reference_image=False, size="1024x1280")
    assert large > small

def test_reference_plus_large_size():
    cost = estimate_credits(has_reference_image=True, size="1024x1280")
    assert cost == 3
