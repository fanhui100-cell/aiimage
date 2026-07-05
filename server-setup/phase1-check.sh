#!/bin/bash
# Phase 1: Server Environment Check
# Run: bash phase1-check.sh
# Purpose: Check system, memory, disk, Docker, and port status before deployment

echo "========================================"
echo " Phase 1: Server Environment Check"
echo "========================================"
echo ""

echo "--- 当前用户 ---"
whoami

echo ""
echo "--- 当前目录 ---"
pwd

echo ""
echo "--- 操作系统版本 ---"
cat /etc/os-release

echo ""
echo "--- 内存使用情况 ---"
free -h

echo ""
echo "--- 硬盘使用情况 ---"
df -h

echo ""
echo "--- Docker 版本 ---"
docker --version 2>/dev/null || echo "Docker 未安装"

echo ""
echo "--- Docker Compose 版本 ---"
docker compose version 2>/dev/null || echo "Docker Compose 未安装"

echo ""
echo "--- 端口占用情况 ---"
sudo ss -tulpn

echo ""
echo "========================================"
echo " 分析结果"
echo "========================================"

# Memory check
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo ""
echo "内存总量: ${TOTAL_MEM}MB"
if [ "$TOTAL_MEM" -lt 3800 ]; then
    echo "⚠️  内存不足 4GB — 只能部署 n8n，Dify 需升级服务器再部署"
    echo "   建议升级到 2核4GB（最低）或 2核8GB（推荐）"
else
    echo "✅ 内存充足，可以部署 n8n + Dify"
fi

# Disk check
DISK_FREE=$(df -BG / | awk 'NR==2{gsub("G",""); print $4}')
echo ""
echo "根目录可用空间: ${DISK_FREE}GB"
if [ "$DISK_FREE" -lt 10 ]; then
    echo "⚠️  硬盘可用空间不足 10GB，建议清理后再部署"
else
    echo "✅ 硬盘空间充足"
fi

# Docker check
echo ""
if command -v docker &>/dev/null; then
    echo "✅ Docker 已安装: $(docker --version)"
else
    echo "❌ Docker 未安装 — 需要先安装 Docker"
fi

if docker compose version &>/dev/null 2>&1; then
    echo "✅ Docker Compose Plugin 已安装"
else
    echo "❌ Docker Compose Plugin 未安装"
fi

# Port check
echo ""
echo "--- 关键端口占用检查 ---"
for PORT in 80 443 5678 3000 8080; do
    if sudo ss -tulpn | grep -q ":${PORT} "; then
        echo "⚠️  端口 ${PORT} 已被占用"
    else
        echo "✅ 端口 ${PORT} 可用"
    fi
done

echo ""
echo "Phase 1 检查完成。请把以上输出发给 AI 助手继续下一步。"
