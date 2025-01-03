# get-temp-creds.sh
#!/bin/bash

# Get temporary credentials from AWS SSO session
eval $(aws configure export-credentials --profile observability2 --format env)

# Start docker-compose with the temporary credentials
docker-compose -f src/sample-app/docker-compose.yml up
