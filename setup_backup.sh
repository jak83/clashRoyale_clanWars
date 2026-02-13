#!/bin/bash
# Setup script for automated history backups

echo "==================================="
echo "Setting up Clash Wars History Backup"
echo "==================================="
echo ""

# Make backup script executable
chmod +x backup_history.sh
echo "✓ Made backup_history.sh executable"

# Test the backup script
echo ""
echo "Testing backup script..."
./backup_history.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Backup test successful!"
else
    echo ""
    echo "✗ Backup test failed. Check the script."
    exit 1
fi

# Setup cron job
echo ""
echo "Setting up daily cron job..."
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/backup_history.sh"

# Check if cron job already exists
CRON_EXISTS=$(crontab -l 2>/dev/null | grep -F "$SCRIPT_PATH" | wc -l)

if [ $CRON_EXISTS -eq 0 ]; then
    # Add cron job: Run daily at 2:00 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * $SCRIPT_PATH >> $HOME/clash-backup.log 2>&1") | crontab -
    echo "✓ Cron job added: Daily backup at 2:00 AM"
    echo "  Logs will be written to: $HOME/clash-backup.log"
else
    echo "⚠ Cron job already exists, skipping"
fi

# Show current cron jobs
echo ""
echo "Current backup schedule:"
crontab -l 2>/dev/null | grep -F "backup_history.sh"

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Backup configuration:"
echo "  - Script: $SCRIPT_PATH"
echo "  - Schedule: Daily at 2:00 AM"
echo "  - Backup location: $HOME/clash-history-backups"
echo "  - Retention: 30 days"
echo "  - Log file: $HOME/clash-backup.log"
echo ""
echo "Manual backup: ./backup_history.sh"
echo "View schedule: crontab -l"
echo "View logs: tail -f ~/clash-backup.log"
echo ""
