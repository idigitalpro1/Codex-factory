from __future__ import annotations

import uuid
from datetime import datetime, timezone

from .db import db


def _utcnow():
    return datetime.now(timezone.utc)


class Article(db.Model):
    __tablename__ = "articles"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    brand = db.Column(db.String(100), nullable=False, index=True)
    title = db.Column(db.String(500), nullable=False)
    slug = db.Column(db.String(500), nullable=False)
    body = db.Column(db.Text, nullable=False, default="")
    author = db.Column(db.String(200), nullable=False, default="")
    status = db.Column(db.String(20), nullable=False, default="draft", index=True)
    scheduled_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "brand": self.brand,
            "title": self.title,
            "slug": self.slug,
            "body": self.body,
            "author": self.author,
            "status": self.status,
            "scheduled_at": self.scheduled_at.isoformat() if self.scheduled_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class Invoice(db.Model):
    __tablename__ = "invoices"

    id                   = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    date                 = db.Column(db.String(10), nullable=False)
    client               = db.Column(db.String(200), nullable=False)
    email                = db.Column(db.String(200), nullable=False, default="")
    type                 = db.Column(db.String(50), nullable=False, default="Classified Ad")
    description          = db.Column(db.Text, nullable=False, default="")
    amount               = db.Column(db.Float, nullable=False, default=0.0)
    status               = db.Column(db.String(20), nullable=False, default="draft", index=True)
    publication          = db.Column(db.String(100), nullable=False, default="Register-Call")
    run_dates            = db.Column(db.Text, nullable=False, default="[]")
    line_count           = db.Column(db.Integer, nullable=False, default=1)
    runs                 = db.Column(db.Integer, nullable=False, default=1)
    first_line_rate      = db.Column(db.Float, nullable=False, default=0.43)
    additional_line_rate = db.Column(db.Float, nullable=False, default=0.38)
    origination_fee      = db.Column(db.Float, nullable=False, default=25.0)
    is_arapahoe_county   = db.Column(db.Boolean, nullable=False, default=False)
    pdf_url              = db.Column(db.String(500), nullable=True)
    stripe_link          = db.Column(db.String(500), nullable=True)
    email_sent           = db.Column(db.String(50), nullable=True)
    paid_date            = db.Column(db.String(10), nullable=True)
    notes                = db.Column(db.Text, nullable=True)
    created_at           = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at           = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    def to_dict(self):
        return {
            "id":                  self.id,
            "date":                self.date,
            "client":              self.client,
            "email":               self.email,
            "type":                self.type,
            "description":         self.description,
            "amount":              round(self.amount, 2),
            "status":              self.status,
            "publication":         self.publication,
            "runDates":            self.run_dates,
            "lineCount":           self.line_count,
            "runs":                self.runs,
            "firstLineRate":       self.first_line_rate,
            "additionalLineRate":  self.additional_line_rate,
            "originationFee":      self.origination_fee,
            "isArapahoeCounty":    self.is_arapahoe_county,
            "pdfUrl":              self.pdf_url or "",
            "stripeLink":          self.stripe_link or "",
            "emailSent":           self.email_sent or "",
            "paidDate":            self.paid_date or "",
            "notes":               self.notes or "",
            "created_at":          self.created_at.isoformat(),
            "updated_at":          self.updated_at.isoformat(),
        }


class OpsDomain(db.Model):
    __tablename__ = "ops_domains"

    id           = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain       = db.Column(db.String(253), unique=True, nullable=False)
    registrar    = db.Column(db.String(100), nullable=True)
    dns_provider = db.Column(db.String(100), nullable=True)
    expected_ip  = db.Column(db.String(45), nullable=False, default="44.236.197.183")
    homepage_url = db.Column(db.String(500), nullable=True)
    health_url   = db.Column(db.String(500), nullable=True)
    notes        = db.Column(db.Text, nullable=True)
    tags         = db.Column(db.Text, nullable=True)  # JSON string
    brand_slug   = db.Column(db.String(100), nullable=True)
    has_logo     = db.Column(db.Boolean, nullable=False, default=False)
    has_favicon  = db.Column(db.Boolean, nullable=False, default=False)
    has_og_image = db.Column(db.Boolean, nullable=False, default=False)
    has_masthead = db.Column(db.Boolean, nullable=False, default=False)
    created_at   = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow)
    updated_at   = db.Column(db.DateTime(timezone=True), nullable=False, default=_utcnow, onupdate=_utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "domain":       self.domain,
            "brand_slug":   self.brand_slug or "",
            "registrar":    self.registrar,
            "dns_provider": self.dns_provider,
            "expected_ip":  self.expected_ip,
            "homepage_url": self.homepage_url,
            "health_url":   self.health_url,
            "notes":        self.notes,
            "tags":         self.tags,
            "has_logo":     self.has_logo,
            "has_favicon":  self.has_favicon,
            "has_og_image": self.has_og_image,
            "has_masthead": self.has_masthead,
            "created_at":   self.created_at.isoformat(),
            "updated_at":   self.updated_at.isoformat(),
        }
