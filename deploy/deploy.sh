
#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${EC2_INSTANCE_ID:?EC2_INSTANCE_ID is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

COMMANDS=$(jq -n \
  --arg tag "$IMAGE_TAG" \
  '{
    commands: [
      "set -e",
      "cd /home/ubuntu/task-management",
      ("sudo sed -i -E \"s|(task-management-backend:)[^[:space:]]+|\\1" + $tag + "|\" compose.yaml"),
      ("sudo sed -i -E \"s|(task-management-frontend:)[^[:space:]]+|\\1" + $tag + "|\" compose.yaml"),
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
