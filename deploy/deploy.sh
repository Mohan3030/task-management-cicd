
#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${EC2_INSTANCE_ID:?EC2_INSTANCE_ID is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

COMMANDS=$(jq -n \
  --arg tag "$IMAGE_TAG" \
  '{
    commands: [
      "set -eu",
      "cd /home/ubuntu/task-management",
      "aws ecr get-login-password --region ap-south-1 | sudo docker login --username AWS --password-stdin 631237578239.dkr.ecr.ap-south-1.amazonaws.com",
      "BACKUP=$(mktemp)",
      "if ! sudo cp compose.yaml \"$BACKUP\"; then echo Could not create backup; exit 1; fi",

      "rollback() { echo Deployment failed. Restoring previous version...; if sudo cp \"$BACKUP\" compose.yaml && sudo docker compose pull backend frontend && sudo docker compose up -d; then ROLLBACK_HEALTHY=0; for i in $(seq 1 12); do if curl -fsS http://localhost/api/health >/dev/null; then ROLLBACK_HEALTHY=1; break; fi; sleep 5; done; if [ \"$ROLLBACK_HEALTHY\" -eq 1 ]; then echo Rollback completed and previous application is healthy.; else echo CRITICAL: Previous version restored but health check failed. Manual recovery required.; fi; else echo CRITICAL: Rollback failed. Manual recovery required.; fi; rm -f \"$BACKUP\"; }", 
      ("if ! sudo sed -i -E \"s|(task-management-backend:)[^[:space:]]+|\\1" + $tag + "|\" compose.yaml; then rollback; exit 1; fi"),
      ("if ! sudo sed -i -E \"s|(task-management-frontend:)[^[:space:]]+|\\1" + $tag + "|\" compose.yaml; then rollback; exit 1; fi"),

      "if ! sudo docker compose pull backend frontend; then rollback; exit 1; fi",
      "if ! sudo docker compose up -d; then rollback; exit 1; fi",

      "HEALTHY=0",
      "for i in $(seq 1 12); do if curl -fsS http://localhost/api/health >/dev/null; then HEALTHY=1; break; fi; sleep 5; done",
      "if [ \"$HEALTHY\" -ne 1 ]; then echo Application health check failed; rollback; exit 1; fi",

      "rm -f \"$BACKUP\"",
      "sudo docker compose ps",
      "echo Deployment and application health check successful."
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
