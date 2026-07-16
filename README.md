# Gas Guru — 以太坊 Gas 费用实时查看与 AI 分析

**只读以太坊主网 Gas 费用，结合 AI 智能分析给出交易时机建议**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)

## ✨ 功能特性

- **实时 Gas 费用** — 通过公共 RPC 端点轮询获取以太坊主网的 Base Fee 和 Priority Fee，每 30 秒自动刷新
- **AI 智能分析** — 接入 OpenAI 兼容 API（可换 Ollama 等本地模型），用大白话解释当前网络状况和交易建议
- **交易模拟** — 交互式模拟签名 → 广播 → 打包 → 出块结果全流程，帮助理解不同 Gas 价格对成功率的实际影响
- **无需 API Key** — 使用公共 RPC 端点，开箱即用，零配置启动
- **多端点自动故障转移** — 3 个公共 RPC 端点依次尝试，遇到 401/超时/报错自动切换下一个，保障数据可用性
- **暗色主题** — 精心设计的暗色 UI，长时间查看也不刺眼

## 📦 技术栈

| 类别   | 技术                               |
| ------ | ---------------------------------- |
| 框架   | Next.js 16 (App Router)            |
| 语言   | TypeScript                         |
| UI     | React 19 + Tailwind CSS 4          |
| 区块链 | 原生 fetch + 公共 RPC 端点         |
| AI     | OpenAI SDK（兼容任何 OpenAI 端点） |

## 🚀 快速开始

### 环境要求

- Node.js 18+（推荐 20+）
- npm / yarn / pnpm / bun

### 安装与运行

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd gas-guru

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

> 实时 Gas 费用面板 + AI 分析 + 交易模拟，暗色主题开箱即用。

### 构建与部署

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm start
```

## ⚙️ 配置说明

### Gas RPC 端点（无需配置，开箱即用）

Gas 费用数据通过公共 RPC 端点获取，**无需任何配置或 API Key**。项目默认内置以下 3 个端点（按稳定性排序，自动故障转移）：

1. `https://ethereum-rpc.publicnode.com` — 最稳定
2. `https://eth.drpc.org` — 稳定
3. `https://rpc.flashbots.net` — 稳定

> **注意**：Ankr、Merkle、1rpc、Llama 等端点因要求 API Key 或存在 Cloudflare 拦截等问题，已移除。如需添加新的公共端点，编辑 `lib/chains.ts` 中的 `RPC_URLS` 数组。

### AI 分析端点（可选配置）

AI 分析功能默认使用 `https://api.openai.com/v1`，你可以点击右上角 ⚙️ 按钮在设置面板中自定义：

| 字段     | 说明                                                   | 默认值                        |
| -------- | ------------------------------------------------------ | ----------------------------- |
| AI 端点  | 任何 OpenAI 兼容的 API 地址（支持 Ollama、本地模型等） | `https://api.openai.com/v1` |
| API Key  | 你的 API Key（本地模型或不需要 Key 的服务填`none`）  | -                             |
| 模型名称 | 要使用的模型                                           | `gpt-4o-mini`               |

**环境变量（`.env.local`，优先级低于设置面板）：**

```bash
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-xxx
LLM_MODEL=gpt-4o-mini
```

## 📱 功能说明

### Gas 费用面板

实时显示当前网络的 Base Fee 和 Priority Fee，以颜色标识费用水平：

| 颜色    | Base Fee   | 含义     |
| ------- | ---------- | -------- |
| 🟢 绿色 | < 10 Gwei  | 非常便宜 |
| 🟡 黄色 | 10-25 Gwei | 适中     |
| 🟠 橙色 | 25-50 Gwei | 偏高     |
| 🔴 红色 | > 50 Gwei  | 非常拥堵 |

### AI 分析

选择操作类型（转账 / NFT / 合约交互），点击"生成建议"获取：

- 网络拥堵状况判断
- 交易费用估算
- 交易时机建议

### 交易模拟

模拟完整的交易流程：签名 → 广播 → 打包 → 出块结果，帮助理解 Gas 定价对交易成功率的影响。

## 📸 运行效果

以下是项目的实际运行截图：

### 1. 主页面 — 实时 Gas 费用面板

> 页面顶部显示 RPC 和 AI 的连接状态，2×2 网格布局分别展示 Gas 费用（带颜色标识）、网络信息、AI 分析入口和交易模拟入口。Gas 数据每 30 秒自动刷新。

### 2. 设置面板 — 配置 AI 端点

> 点击右上角 ⚙️ 按钮弹出设置面板，可自定义 AI 端点地址、API Key 和模型名称，支持一键恢复默认设置。配置保存后自动检测连接状态并实时刷新数据。

### 3. AI 智能分析 — 交易建议

> 选择操作类型（Transfer / NFT / Contract），点击"生成建议"后 AI 结合当前 Gas 数据和网络状态，用大白话给出是否适合交易的建议。未配置 AI 时自动使用内置默认回复。

### 4. 交易模拟 — 选择 Gas 档位

> 弹出交易模拟面板，默认提供三种 Gas 档位（慢/标准/快），AI 会根据当前 Base Fee 自动推荐合适的档位。用户可以通过滑块手动调整 Priority Fee，实时看到成功率和费用估算。

### 5. 交易模拟 — 广播与打包过程

> 点击"Bid Transaction"后模拟完整的交易流程：签名 → 广播（带进度条动画）→ 等待打包（进度条）→ 最终出块结果（成功/失败），直观展示不同 Gas 定价对交易结果的影响。

## 📁 项目结构

```
gas-guru/
├── app/
│   ├── api/
│   │   ├── gas-explain/    # AI 分析 API 路由
│   │   ├── gas-fees/       # Gas 费用 API 路由
│   │   └── test-connection/# LLM 连接检测 API 路由
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 主页（核心 UI）
│   └── globals.css         # 全局样式
├── components/
│   └── TransactionModal.tsx # 交易模拟弹窗
├── lib/
│   ├── chains.ts           # 链配置 + RPC 端点列表
│   └── eth.ts              # RPC 调用工具（自动故障转移）
├── next.config.ts          # Next.js 配置
├── package.json
└── README.md
```

## 🔄 数据刷新

- Gas 费用数据每 **30 秒**自动刷新
- 设置面板保存后自动刷新

## 🛠 开发指南

### 添加新的公共 RPC 端点

编辑 `lib/chains.ts` 中的 `RPC_URLS` 数组，将新端点添加到头部（优先使用）：

```typescript
const RPC_URLS: string[] = [
  'https://ethereum-rpc.publicnode.com',
  'https://你的新端点.com/eth',
  // ...
];
```

### 自定义 Gas 估算

编辑 `lib/chains.ts` 中链配置的 `gasEstimates` 字段：

```typescript
gasEstimates: {
  transfer: 21000,  // 普通转账
  nft: 80000,       // NFT 铸造/转移
  swap: 150000,     // DeFi 互换
},
```

## ⚠️ 注意事项

1. **公共 RPC 有速率限制** — 如果频繁调用可能会遇到暂时不可用，请等待几秒后重试
2. **AI 分析需要配置 LLM 端点** — 未配置时使用内置默认回复
3. **交易模拟仅为演示** — 不真实上链，成功率由算法模拟
4. **仅支持以太坊主网** — 不支持测试网或其他链

## 📄 License

MIT
