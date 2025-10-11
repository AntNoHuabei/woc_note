# Store 使用说明

## PingCode Store 使用指南

### 1. 基本配置

首先需要配置 PingCode 的客户端凭据：

```typescript
import { usePingCodeStore } from '@/store/pingcode'

const pingCodeStore = usePingCodeStore()

// 设置客户端凭据
pingCodeStore.setCredentials({
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  api_root: 'https://your-pingcode-instance.pingcode.com'
})

// 获取企业令牌
const success = await pingCodeStore.getEnterpriseToken()
if (success) {
  console.log('PingCode 连接成功')
}
```

### 2. 主要功能

#### 令牌管理
- `getEnterpriseToken()`: 获取企业令牌
- `refreshToken()`: 刷新令牌
- `isTokenExpired()`: 检查令牌是否过期
- `clearToken()`: 清除令牌

#### 项目管理
- `getProjects()`: 获取项目列表
- `getWorkItems(projectKey?)`: 获取工作项列表

#### 工作项管理
- `getWorkItem(issueKey)`: 获取特定工作项详情
- `createWorkItem(workItemData)`: 创建新工作项
- `updateWorkItem(issueKey, updateData)`: 更新工作项
- `deleteWorkItem(issueKey)`: 删除工作项

### 3. 自动令牌刷新

Store 会自动处理令牌刷新：
- 令牌过期前1分钟自动刷新
- 支持本地存储持久化
- 包含完整的错误处理

### 4. 缓存机制

- 项目列表缓存10分钟
- 工作项列表缓存10分钟
- 自动清除过期缓存

### 5. 错误处理

所有API调用都包含完整的错误处理：
- 网络错误
- 认证错误
- 权限错误
- 自动降级到缓存数据

### 6. 使用示例

```typescript
// 在组件中使用
import { usePingCodeStore } from '@/store/pingcode'

export default {
  setup() {
    const pingCodeStore = usePingCodeStore()
    
    // 检查连接状态
    const isConnected = computed(() => 
      pingCodeStore.isAuthenticated && !pingCodeStore.isTokenExpired()
    )
    
    // 获取数据
    const loadData = async () => {
      if (isConnected.value) {
        const projects = await pingCodeStore.getProjects()
        const workItems = await pingCodeStore.getWorkItems()
        console.log('Projects:', projects)
        console.log('Work Items:', workItems)
      }
    }
    
    return {
      isConnected,
      loadData
    }
  }
}
```

### 7. 注意事项

1. **企业令牌权限**: 企业令牌具有系统管理员权限，请谨慎管理
2. **API 根地址**: 确保使用正确的 PingCode 实例地址
3. **令牌有效期**: 企业令牌有效期为30天，会自动刷新
4. **数据范围**: 根据应用配置的数据范围访问相应数据
5. **错误处理**: 建议在UI中显示适当的错误信息

### 8. 接口文档参考

- [PingCode API 文档](https://developer.pingcode.com/)
- [OAuth2 客户端凭据模式](https://developer.pingcode.com/docs/oauth2-client-credentials)
- [工作项管理 API](https://developer.pingcode.com/docs/work-items)
