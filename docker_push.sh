#!/bin/bash
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin