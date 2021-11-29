#!/bin/bash

nodemon --exec "echo '' >> playground/api/restaurant/models/restaurant.js" --watch services/ --watch config --watch controllers --watch connectors
