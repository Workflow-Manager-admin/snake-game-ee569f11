#!/bin/bash
cd /home/kavia/workspace/code-generation/snake-game-ee569f11/frontend_snake_game
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

