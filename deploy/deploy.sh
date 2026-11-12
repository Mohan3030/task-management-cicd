
#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${EC2_INSTANCE_ID:?EC2_INSTANCE_ID is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

COMMANDS=$(jq -n \
  --arg tag "$IMAGE_TAG" \
  '{
    commands: [
      "set -Eeuo pipefail",
      "cd /home/ubuntu/task-management",

      "BACKUP=$(mktemp)",
      "sudo cp compose.yaml \"$BACKUP\"",

      "rollback() { STATUS=$?; trap - ERR; echo Deployment failed. Rolling back...; if sudo cp \"$BACKUP\" compose.yaml && sudo docker compose pull backend frontend && sudo docker compose up -d; then echo Rollback completed. Previous version restored.; else echo CRITICAL: Rollback failed. Manual recovery required.; fi; rm -f \"$BACKUP\"; exit \"$STATUS\"; }",
      "trap rollback ERR",

      ("sudo sed -i -E \"s|(task-management-backend:)[^[:space:]]+|\\1" + $tag + "|\" compose.yaml"),
      ("sudo sed -i -E \"s|(task-management-frontend:)[^[:space:]]+|\\1" + $tag + "|\" compose.yaml"),

      "sudo docker compose pull backend frontend",
      "sudo docker compose up -d",

      "HEALTHY=0",
      "for i in $(seq 1 12); do if sudo docker compose exec -T backend node -e \"fetch('http://frontend/api/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))\"; then HEALTHY=1; break; fi; sleep 5; done",
      "if [ \"$HEALTHY\" -ne 1 ]; then echo Application health check failed; false; fi",

      "trap - ERR",
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
