#!/bin/bash
# Check backup automation status

echo "========================================="
echo "Clash Wars Backup Status Check"
echo "========================================="
echo ""

# 1. Check if cron job exists
echo "📅 CRON JOB STATUS:"
echo "-------------------"
CRON_COUNT=$(crontab -l 2>/dev/null | grep -c "backup_history.sh")
if [ $CRON_COUNT -gt 0 ]; then
    echo "✓ Cron job is ACTIVE"
    echo ""
    echo "Schedule:"
    crontab -l 2>/dev/null | grep "backup_history.sh"
    echo ""
else
    echo "✗ Cron job NOT FOUND"
    echo ""
    echo "To set up automatic backups, run:"
    echo "  ./setup_backup.sh"
    echo ""
fi

# 2. Check backup directory
echo "📁 BACKUP DIRECTORY:"
echo "-------------------"
BACKUP_DIR="$HOME/clash-history-backups"
if [ -d "$BACKUP_DIR" ]; then
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/clash-history-*.tar.gz 2>/dev/null | wc -l)
    if [ $BACKUP_COUNT -gt 0 ]; then
        echo "✓ Backup directory exists: $BACKUP_DIR"
        echo "✓ Found $BACKUP_COUNT backup(s)"
        echo ""

        # Show most recent backups
        echo "Recent backups (last 5):"
        ls -1t "$BACKUP_DIR"/clash-history-*.tar.gz 2>/dev/null | head -5 | while read file; do
            SIZE=$(du -h "$file" | cut -f1)
            FILENAME=$(basename "$file")
            echo "  - $FILENAME ($SIZE)"
        done
        echo ""

        # Show oldest backup (for retention check)
        OLDEST=$(ls -1t "$BACKUP_DIR"/clash-history-*.tar.gz 2>/dev/null | tail -1)
        if [ -n "$OLDEST" ]; then
            AGE_DAYS=$(( ($(date +%s) - $(stat -c %Y "$OLDEST" 2>/dev/null || stat -f %m "$OLDEST")) / 86400 ))
            echo "Oldest backup: $(basename "$OLDEST") (${AGE_DAYS} days old)"
            if [ $AGE_DAYS -gt 30 ]; then
                echo "⚠  Warning: Cleanup may not be working (backup older than 30 days)"
            fi
        fi
    else
        echo "⚠  Backup directory exists but is EMPTY"
        echo "   Location: $BACKUP_DIR"
        echo ""
        echo "Run a manual backup to test:"
        echo "  ./backup_history.sh"
    fi
else
    echo "✗ Backup directory does NOT exist"
    echo "   Expected: $BACKUP_DIR"
    echo ""
    echo "Run setup to create:"
    echo "  ./setup_backup.sh"
fi

echo ""

# 3. Check backup log
echo "📋 BACKUP LOG:"
echo "-------------------"
LOG_FILE="$HOME/clash-backup.log"
if [ -f "$LOG_FILE" ]; then
    echo "✓ Log file exists: $LOG_FILE"
    LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
    echo "  Size: $LOG_SIZE"
    echo ""

    # Show last backup from log
    echo "Last backup run (from log):"
    tail -20 "$LOG_FILE" | grep -A 5 "Clash Wars History Backup" | tail -6
else
    echo "⚠  Log file not found: $LOG_FILE"
    echo "   (Will be created after first cron run)"
fi

echo ""

# 4. Check source data
echo "💾 SOURCE DATA:"
echo "-------------------"
PROJECT_DIR="$HOME/clashApi"
if [ -d "$PROJECT_DIR/ongoing" ]; then
    ONGOING_SIZE=$(du -sh "$PROJECT_DIR/ongoing" 2>/dev/null | cut -f1)
    echo "✓ ongoing/ exists ($ONGOING_SIZE)"
else
    echo "✗ ongoing/ not found"
fi

if [ -d "$PROJECT_DIR/history" ]; then
    HISTORY_SIZE=$(du -sh "$PROJECT_DIR/history" 2>/dev/null | cut -f1)
    HISTORY_COUNT=$(ls -1 "$PROJECT_DIR/history" 2>/dev/null | wc -l)
    echo "✓ history/ exists ($HISTORY_SIZE, $HISTORY_COUNT files)"
else
    echo "⚠  history/ not found (will be created after first war completes)"
fi

echo ""

# 5. Next scheduled run
echo "⏰ NEXT SCHEDULED BACKUP:"
echo "-------------------"
if [ $CRON_COUNT -gt 0 ]; then
    # Extract hour and minute from cron
    CRON_TIME=$(crontab -l 2>/dev/null | grep "backup_history.sh" | awk '{print $1":"$2}')
    if [ -n "$CRON_TIME" ]; then
        # Calculate next run (simplified - assumes daily)
        CURRENT_HOUR=$(date +%H)
        CURRENT_MIN=$(date +%M)
        BACKUP_HOUR=$(echo $CRON_TIME | cut -d: -f1)
        BACKUP_MIN=$(echo $CRON_TIME | cut -d: -f2)

        # Simple next run calculation
        if [ $CURRENT_HOUR -lt $BACKUP_HOUR ]; then
            echo "Today at $CRON_TIME (in a few hours)"
        else
            echo "Tomorrow at $CRON_TIME"
        fi
    fi
else
    echo "No cron job scheduled"
fi

echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="

# Overall status
if [ $CRON_COUNT -gt 0 ] && [ -d "$BACKUP_DIR" ] && [ $BACKUP_COUNT -gt 0 ]; then
    echo "✅ Backup automation is WORKING"
    echo ""
    echo "Your history data is protected with:"
    echo "  - Automatic daily backups at 2:00 AM"
    echo "  - $BACKUP_COUNT backup(s) stored"
    echo "  - 30-day retention policy"
else
    echo "⚠️  Backup automation needs setup"
    echo ""
    echo "Run this command to enable:"
    echo "  ./setup_backup.sh"
fi

echo ""
echo "Commands:"
echo "  Manual backup:     ./backup_history.sh"
echo "  View full log:     tail -f ~/clash-backup.log"
echo "  List all backups:  ls -lh ~/clash-history-backups/"
echo ""
