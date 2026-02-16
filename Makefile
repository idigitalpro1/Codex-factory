SHELL := /bin/bash

BACKEND_DIR := backend
FRONTEND_DIR := frontend/beta
RUN_DIR := .run
ROOT_DIR := $(CURDIR)

BACKEND_PORT ?= 8080
FRONTEND_PORT ?= 8090

BACKEND_PID_FILE := $(ROOT_DIR)/$(RUN_DIR)/backend.pid
FRONTEND_PID_FILE := $(ROOT_DIR)/$(RUN_DIR)/frontend.pid
BACKEND_LOG := $(ROOT_DIR)/$(RUN_DIR)/backend.log
FRONTEND_LOG := $(ROOT_DIR)/$(RUN_DIR)/frontend.log

.PHONY: up down status health

up:
	@mkdir -p "$(RUN_DIR)"
	@if [ ! -x "$(BACKEND_DIR)/.venv/bin/python" ]; then \
		echo "[up] Creating backend virtual environment"; \
		python3 -m venv "$(BACKEND_DIR)/.venv"; \
	fi
	@echo "[up] Installing backend dependencies"
	@"$(BACKEND_DIR)/.venv/bin/pip" install -r "$(BACKEND_DIR)/requirements.txt" >/dev/null
	@backend_listener_pid=$$(lsof -tiTCP:$(BACKEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
	backend_pid_file_pid=$$(cat "$(BACKEND_PID_FILE)" 2>/dev/null || true); \
	if [ -n "$$backend_listener_pid" ] && [ -n "$$backend_pid_file_pid" ] && [ "$$backend_listener_pid" = "$$backend_pid_file_pid" ]; then \
		echo "[up] Backend already running (pid $$backend_listener_pid, port $(BACKEND_PORT))"; \
	elif [ -n "$$backend_listener_pid" ]; then \
		echo "[up] Backend port $(BACKEND_PORT) is already in use by pid $$backend_listener_pid"; \
		echo "[up] Run 'make down' or free the port before retrying"; \
		exit 1; \
	else \
		echo "[up] Starting backend on http://localhost:$(BACKEND_PORT)"; \
		cd "$(BACKEND_DIR)" && nohup .venv/bin/python run.py > "$(BACKEND_LOG)" 2>&1 & \
		sleep 1; \
		backend_listener_pid=$$(lsof -tiTCP:$(BACKEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
		if [ -z "$$backend_listener_pid" ]; then \
			echo "[up] Backend failed to start"; \
			tail -n 50 "$(BACKEND_LOG)" || true; \
			exit 1; \
		fi; \
		echo "$$backend_listener_pid" > "$(BACKEND_PID_FILE)"; \
		echo "[up] Backend started (pid $$backend_listener_pid)"; \
	fi
	@frontend_listener_pid=$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
	frontend_pid_file_pid=$$(cat "$(FRONTEND_PID_FILE)" 2>/dev/null || true); \
	if [ -n "$$frontend_listener_pid" ] && [ -n "$$frontend_pid_file_pid" ] && [ "$$frontend_listener_pid" = "$$frontend_pid_file_pid" ]; then \
		echo "[up] Frontend already running (pid $$frontend_listener_pid, port $(FRONTEND_PORT))"; \
	elif [ -n "$$frontend_listener_pid" ]; then \
		echo "[up] Frontend port $(FRONTEND_PORT) is already in use by pid $$frontend_listener_pid"; \
		echo "[up] Run 'make down' or free the port before retrying"; \
		exit 1; \
	else \
		echo "[up] Starting frontend on http://localhost:$(FRONTEND_PORT)"; \
		cd "$(FRONTEND_DIR)" && nohup python3 -m http.server "$(FRONTEND_PORT)" > "$(FRONTEND_LOG)" 2>&1 & \
		sleep 1; \
		frontend_listener_pid=$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
		if [ -z "$$frontend_listener_pid" ]; then \
			echo "[up] Frontend failed to start"; \
			tail -n 50 "$(FRONTEND_LOG)" || true; \
			exit 1; \
		fi; \
		echo "$$frontend_listener_pid" > "$(FRONTEND_PID_FILE)"; \
		echo "[up] Frontend started (pid $$frontend_listener_pid)"; \
	fi
	@echo "[up] Backend log: $(BACKEND_LOG)"
	@echo "[up] Frontend log: $(FRONTEND_LOG)"

down:
	@backend_pid=$$(cat "$(BACKEND_PID_FILE)" 2>/dev/null || true); \
	if [ -z "$$backend_pid" ]; then \
		backend_pid=$$(lsof -tiTCP:$(BACKEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
	fi; \
	if [ -n "$$backend_pid" ]; then \
		echo "[down] Stopping backend (pid $$backend_pid)"; \
		kill "$$backend_pid" 2>/dev/null || true; \
		for _ in $$(seq 1 20); do \
			current=$$(lsof -tiTCP:$(BACKEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
			[ "$$current" != "$$backend_pid" ] && break; \
			sleep 0.1; \
		done; \
		current=$$(lsof -tiTCP:$(BACKEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
		if [ "$$current" = "$$backend_pid" ]; then \
			echo "[down] Backend still listening on :$(BACKEND_PORT)"; \
			exit 1; \
		fi; \
		echo "[down] Backend stopped"; \
	else \
		echo "[down] Backend is not running"; \
	fi
	@frontend_pid=$$(cat "$(FRONTEND_PID_FILE)" 2>/dev/null || true); \
	if [ -z "$$frontend_pid" ]; then \
		frontend_pid=$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
	fi; \
	if [ -n "$$frontend_pid" ]; then \
		echo "[down] Stopping frontend (pid $$frontend_pid)"; \
		kill "$$frontend_pid" 2>/dev/null || true; \
		for _ in $$(seq 1 20); do \
			current=$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
			[ "$$current" != "$$frontend_pid" ] && break; \
			sleep 0.1; \
		done; \
		current=$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
		if [ "$$current" = "$$frontend_pid" ]; then \
			echo "[down] Frontend still listening on :$(FRONTEND_PORT)"; \
			exit 1; \
		fi; \
		echo "[down] Frontend stopped"; \
	else \
		echo "[down] Frontend is not running"; \
	fi
	@rm -f "$(BACKEND_PID_FILE)" "$(FRONTEND_PID_FILE)"

status:
	@echo "[status] Backend port $(BACKEND_PORT)"
	@lsof -nP -iTCP:$(BACKEND_PORT) -sTCP:LISTEN || true
	@echo "[status] Frontend port $(FRONTEND_PORT)"
	@lsof -nP -iTCP:$(FRONTEND_PORT) -sTCP:LISTEN || true
	@backend_listener_pid=$$(lsof -tiTCP:$(BACKEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
	if [ -n "$$backend_listener_pid" ]; then \
		echo "$$backend_listener_pid" > "$(BACKEND_PID_FILE)"; \
		echo "[status] backend.pid=$$backend_listener_pid"; \
	else \
		rm -f "$(BACKEND_PID_FILE)"; \
		echo "[status] backend.pid=none"; \
	fi
	@frontend_listener_pid=$$(lsof -tiTCP:$(FRONTEND_PORT) -sTCP:LISTEN 2>/dev/null | head -n1); \
	if [ -n "$$frontend_listener_pid" ]; then \
		echo "$$frontend_listener_pid" > "$(FRONTEND_PID_FILE)"; \
		echo "[status] frontend.pid=$$frontend_listener_pid"; \
	else \
		rm -f "$(FRONTEND_PID_FILE)"; \
		echo "[status] frontend.pid=none"; \
	fi

health:
	@echo "[health] Probing backend on port $(BACKEND_PORT)"
	@selected=""; payload=""; \
	for host in localhost 127.0.0.1 '[::1]'; do \
		url="http://$$host:$(BACKEND_PORT)/api/v1/health"; \
		if out=$$(curl -sS --max-time 2 "$$url" 2>/dev/null); then \
			selected="$$host"; \
			payload="$$out"; \
			break; \
		fi; \
	done; \
	if [ -z "$$selected" ]; then \
		echo "[health] No reachable health endpoint found"; \
		exit 1; \
	fi; \
	echo "[health] selected_host=$$selected"; \
	echo "$$payload"
