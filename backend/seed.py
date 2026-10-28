"""Seed data for Northwind Outdoor brand guidelines — loads idempotently."""
from sqlalchemy.orm import Session
from backend.models import GuidelineClause, ApprovedFact

CLAUSES = [
    {
        "code": "V-2.1",
        "title": "Voice: Calm and Confident",
        "text": (
            "Voice: calm, confident, no hype. Use at most one exclamation mark per piece. "
            "Avoid breathless or superlative language that overpromises. "
            "The brand voice is grounded, practical and trustworthy."
        ),
        "version": "1.0",
    },
    {
        "code": "T-09",
        "title": "Terminology: Customers",
        "text": (
            "Terminology: always say 'customers', never 'clients'. "
            "We serve people who buy outdoor gear, not business clients. "
            "The word 'clients' is reserved for B2B partner communications only."
        ),
        "version": "1.0",
    },
    {
        "code": "C-3.2",
        "title": "Claims Policy: Superlatives and Guarantees",
        "text": (
            "Claims policy: superlatives such as '#1', 'best', 'leading', 'fastest', "
            "'most popular' and absolute guarantees require approved evidence on file. "
            "Each such claim must cite an approved fact code. "
            "Unsupported superlatives mislead customers and create legal exposure."
        ),
        "version": "1.0",
    },
    {
        "code": "C-3.4",
        "title": "No Unconditional Guarantees",
        "text": (
            "No unconditional guarantees: do not use 'guaranteed', 'forever', "
            "'lifetime guarantee', 'always works', or similar absolute promises. "
            "All warranties are subject to terms published on the website. "
            "Use 'designed to last' or 'backed by our warranty' instead."
        ),
        "version": "1.0",
    },
    {
        "code": "A-1.1",
        "title": "Accessibility: Plain Language",
        "text": (
            "Accessibility: use plain language, avoid jargon and technical terms "
            "that a general audience would not understand. "
            "Aim for a Flesch-Kincaid reading grade of 8 or below. "
            "Short sentences (under 25 words) are preferred."
        ),
        "version": "1.0",
    },
    {
        "code": "S-1.0",
        "title": "Shipping Policy Accuracy",
        "text": (
            "Shipping policy accuracy: always state the current free-shipping threshold exactly. "
            "The approved threshold is free shipping on orders over $75. "
            "Do not state any other threshold without written approval from the operations team."
        ),
        "version": "1.0",
    },
]

FACTS = [
    {
        "key": "free_shipping_threshold",
        "value": "free shipping on orders over $75",
        "source": "Operations policy OP-2024-11",
    },
    {
        "key": "return_policy",
        "value": "30-day returns",
        "source": "Customer service policy CS-2024-03",
    },
    {
        "key": "review_rating",
        "value": "rated 4.7/5 from 12,480 reviews",
        "source": "Trustpilot verified snapshot 2024-10-01",
    },
    {
        "key": "jacket_material",
        "value": "jackets use 100% recycled polyester shell",
        "source": "Product specification sheet PS-2024-07",
    },
]

SAMPLE_DRAFT = {
    "title": "Northwind Autumn Jacket Campaign Draft",
    "content_text": (
        "Introducing the Northwind Summit Jacket — the #1 rated outdoor jacket on the market! "
        "Our clients love it for its guaranteed waterproof protection forever. "
        "Made from premium materials, this jacket will keep you dry in any conditions! "
        "Order now and enjoy free shipping over $50! "
        "With over a decade of outdoor expertise, we are the leading choice for adventurers everywhere!"
    ),
    "intended_message": (
        "Promote the Northwind Summit Jacket as a high-quality, weatherproof option for outdoor enthusiasts, "
        "highlighting our customer-friendly shipping and returns."
    ),
}


def seed(db: Session) -> None:
    """Load seed data idempotently."""
    for clause_data in CLAUSES:
        existing = db.query(GuidelineClause).filter_by(code=clause_data["code"]).first()
        if not existing:
            db.add(GuidelineClause(**clause_data))

    for fact_data in FACTS:
        existing = db.query(ApprovedFact).filter_by(key=fact_data["key"]).first()
        if not existing:
            db.add(ApprovedFact(**fact_data))

    db.commit()
