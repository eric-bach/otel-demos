#### Getting Started

1. Authenticate with AWS SSO
    aws sso login --profile <AWS_PROFILE>

2. Run docker-compose (this will also export the AWS SSO keys and pass it to the container)
    ./docker-compose.sh
