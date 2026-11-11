
#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${EC2_INSTANCE_ID:?EC2_INSTANCE_ID is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${ECR_REGISTRY:?ECR_REGISTRY is required}"

BACKEND_IMAGE="${ECR_REGISTRY}/task-management-backend:${IMAGE_TAG}"
FRONTEND_IMAGE="${ECR_REGISTRY}/task-management-frontend:${IMAGE_TAG}"

COMMANDS=$(jq -n \
  --arg backend "$BACKEND_IMAGE" \
  --arg frontend "$FRONTEND_IMAGE" \
  '{
    commands: [
      "set -e",
      "cd /home/ubuntu/task-management",
      ("sudo sed -i -E \"s|task-management-backend:[^[:space:]]+|" + $backend + "|\" compose.yaml"),
      ("sudo sed -i -E \"s|task-management-frontend:[^[:space:]]+|" + $frontend + "|\" compose.yaml"),
      "sudo docker compose pull backend frontend",
      "sudo docker compose up -d",
      "sudo docker compose ps"
    ]
  }')

COMMAND_ID=$(aws ssm send-command \
  --region "$AWS_REGION" \
  --instance-ids "$EC2_INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "$COMMANDS" \
  --query "Command.CommandId" \
  --output text)

echo "Deployment command submitted: $COMMAND_ID"

aws ssm wait command-executed \
  --region "$AWS_REGION" \
  --command-id "$COMMAND_ID" \
  --instance-id "$EC2_INSTANCE_ID"

aws ssm get-command-invocation \
  --region "$AWS_REGION" \
  --command-id "$COMMAND_ID" \
  --instance-id "$EC2_INSTANCE_ID" \
  --query "StandardOutputContent" \
  --output text

echo "Deployment completed successfully."
