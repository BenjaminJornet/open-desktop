SHELL := /bin/bash

.PHONY: help setup dev build-dev start test lint check sync-upstream byok-dev clean-node

help:
	@echo "Open Desktop development commands"
	@echo ""
	@echo "  make setup          Install tools and dependencies via mise"
	@echo "  make dev            Build dev bundle and start app"
	@echo "  make build-dev      Build dev bundle only"
	@echo "  make start          Start app only"
	@echo "  make test           Run unit tests"
	@echo "  make lint           Run eslint checks"
	@echo "  make check          Run lint, tests, and dev build"
	@echo "  make sync-upstream  Sync fork with upstream/development"
	@echo "  make byok-dev       Start app with BYOK env vars from .env"
	@echo "  make clean-node     Remove node_modules"

setup:
	mise run setup

dev:
	mise run dev

build-dev:
	mise run build-dev

start:
	mise run start

test:
	mise run test

lint:
	mise run lint

check:
	mise run check

sync-upstream:
	mise run sync-upstream

byok-dev:
	mise run byok-dev

clean-node:
	rm -rf node_modules app/node_modules
