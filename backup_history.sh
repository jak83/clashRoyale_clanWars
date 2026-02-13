#!/bin/bash
# Automated backup script for Clash Wars history data
# Backs up to home directory with timestamp

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$HOME/clash-history-backups"
PROJECT_DIR="$HOME/clashApi"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "==================================="
echo "Clash Wars History Backup"
echo "==================================="
echo "Timestamp: $TIMESTAMP"
echo "Backup location: $BACKUP_DIR"
echo ""

# Check if directories exist
if [ ! -d "$PROJECT_DIR/ongoing" ] && [ ! -d "$PROJECT_DIR/history" ]; then
    echo "ERROR: No history data found at $PROJECT_DIR"
    exit 1
fi

# Create compressed backup
BACKUP_FILE="$BACKUP_DIR/clash-history-$TIMESTAMP.tar.gz"
echo "Creating backup: $BACKUP_FILE"

tar -czf "$BACKUP_FILE" \
    -C "$PROJECT_DIR" \
    ongoing \
    history \
    2>/dev/null

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup created successfully ($BACKUP_SIZE)"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Keep only last 30 days of backups (cleanup old files)
echo ""
echo "Cleaning up old backups (keeping last 30 days)..."
find "$BACKUP_DIR" -name "clash-history-*.tar.gz" -type f -mtime +30 -delete

# Show backup summary
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/clash-history-*.tar.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

echo ""
echo "==================================="
echo "Backup Summary:"
echo "  - Backups stored: $BACKUP_COUNT"
echo "  - Total size: $TOTAL_SIZE"
echo "  - Location: $BACKUP_DIR"
echo "==================================="
