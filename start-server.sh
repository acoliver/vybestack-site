#!/bin/bash
cd /Users/acoliver/projects/vybestack-site
python3 -m http.server 3000 &
echo "Server started on http://localhost:3000"
