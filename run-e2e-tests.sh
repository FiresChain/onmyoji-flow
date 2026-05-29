#!/bin/bash

# E2E 测试运行脚本
# 用法: ./run-e2e-tests.sh [p0|p1|p2|all]

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== onmyoji-flow E2E 测试 ===${NC}\n"

# 检查 Playwright 是否安装
if ! npx playwright --version > /dev/null 2>&1; then
    echo -e "${RED}错误: Playwright 未安装${NC}"
    echo "请运行: npm install"
    exit 1
fi

# 检查浏览器是否安装
if [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}首次运行，正在安装浏览器...${NC}"
    npx playwright install chromium
fi

# 确定运行哪些测试
TEST_PATTERN="e2e/*.spec.ts"
case "$1" in
    p0)
        echo -e "${GREEN}运行 P0 测试（重构底线）${NC}\n"
        TEST_PATTERN="e2e/0[1-6]*.spec.ts"
        ;;
    p1)
        echo -e "${GREEN}运行 P1 测试（组件拆分保护）${NC}\n"
        TEST_PATTERN="e2e/0[7-9]*.spec.ts e2e/1[0-2]*.spec.ts"
        ;;
    p2)
        echo -e "${GREEN}运行 P2 测试（完整性覆盖）${NC}\n"
        TEST_PATTERN="e2e/1[3-6]*.spec.ts"
        ;;
    all|"")
        echo -e "${GREEN}运行所有测试${NC}\n"
        TEST_PATTERN="e2e/*.spec.ts"
        ;;
    *)
        echo -e "${RED}未知参数: $1${NC}"
        echo "用法: $0 [p0|p1|p2|all]"
        exit 1
        ;;
esac

# 运行测试
echo -e "${YELLOW}测试文件: $TEST_PATTERN${NC}\n"
npx playwright test $TEST_PATTERN --reporter=list

# 显示结果
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ 所有测试通过${NC}"
else
    echo -e "\n${RED}✗ 测试失败${NC}"
    echo -e "${YELLOW}查看详细报告: npx playwright show-report${NC}"
    exit 1
fi
