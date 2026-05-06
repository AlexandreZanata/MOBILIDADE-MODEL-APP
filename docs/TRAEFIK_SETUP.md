# Traefik Setup

## Overview

This document defines the standard reverse-proxy baseline for GovMobile services using Traefik.
Use this as the canonical deployment checklist for HTTP routing, TLS termination, and service exposure.

## Scope

- API gateway routing
- WebSocket upgrade support
- TLS/HTTPS termination
- Middleware configuration
- Health checks and observability

## Prerequisites

- Traefik v2+
- Docker or Kubernetes deployment target
- DNS records configured for service domains
- TLS certificate strategy (Let's Encrypt or managed certs)

## Core Requirements

- Force HTTPS in production
- Enable WebSocket upgrades for realtime endpoints
- Protect admin/dashboard endpoints
- Configure request/response timeouts
- Configure trusted proxies and forwarded headers

## Recommended Routing Layout

- `api.<domain>` -> REST services
- `ws.<domain>` -> WebSocket services
- Optional path-based routing for internal APIs:
  - `/v1/*`
  - `/ws/*`

## Security Baseline

- Disable insecure dashboard mode in production
- Restrict dashboard by IP allow-list and/or auth middleware
- Enable HSTS, X-Frame-Options, X-Content-Type-Options
- Limit body size where applicable
- Apply rate limiting to public routes

## Observability

- Access logs enabled
- Error logs enabled
- Metrics exported (Prometheus or equivalent)
- Tracing enabled when available

## Validation Checklist

- [ ] HTTP -> HTTPS redirect works
- [ ] TLS certificates are valid and auto-renewed
- [ ] WebSocket handshake succeeds through proxy
- [ ] CORS and forwarded headers are correct
- [ ] Health endpoints are reachable
- [ ] Rate limits and security headers are active

## Notes

This file replaces the previous empty placeholder and serves as a standardized operational template.
Add environment-specific examples (`docker-compose`, `k8s IngressRoute`, or static config) as needed.

## End of Document
