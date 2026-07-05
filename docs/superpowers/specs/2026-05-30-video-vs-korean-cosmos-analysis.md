# 光球效果分析 & Korean-Cosmos 项目差距报告

> 分析日期：2026-05-30  
> 视频来源：微信视频 `2d0190c38a0421c1f46916cfdd16d9e7.mp4`（56s, 1280×720, 30fps）  
> 项目路径：`D:\ai-studio\korean-cosmos`

---

## 一、视频分析方法

由于当前模型不支持直接查看视频帧，采用了以下手段进行分析：

| 方法 | 结果 |
|---|---|
| ffmpeg 提取 11 帧（5秒间隔） | 获取各时段画面 |
| ffmpeg 提取 4 个关键时刻密集帧（8s/12s/20s/35s） | 精确定位"光球"效果帧 |
| Whisper 音频转录 | 仅有背景音乐，无旁白 |
| Python + OpenCV/PIL 逐帧分析 | 亮度分布、径向渐变、边缘密度、色彩通道、亮斑计数 |

---

## 二、视频内容分析结果

### 2.1 整体特征

| 指标 | 数值 | 含义 |
|---|---|---|
| 全局亮度 | 9.8 ~ 26.6（/255） | 极暗太空背景 |
| 高亮像素占比 | 0.24% ~ 2.41% | 星星/光球稀疏但醒目 |
| 色彩通道 | R≈21, G≈21, B≈26（蓝通道始终最高） | **蓝调太空背景** |
| 亮斑数量 | 148 ~ 1040 个 (>200 亮度) | 大量发光节点/光球 |
| 径向渐变（中心-边缘） | +1.9 ~ +226.8 | **极强中央发光** |
| 薄边缘像素 | 9.66% ~ 17.84% | **密集连线网络** |
| 帧间运动量 | 4.7 ~ 31.3 | 相机在 3D 空间中飞行 |

---

### 2.2 "光球"效果的关键数值

以 **8 秒帧**（光球效果最典型的时刻）为例：

```txt
全局亮度：23.2（/255）
高亮像素：16,131 px（1.75%）
最大光球：半径≈34px，位于画面(632, 374)
光球总数：577 个
径向渐变：+90.4（从中心到边缘，中心亮 90 个单位）
薄边缘线：153,778 px（16.69%）— 即 ~17% 的画面是细线
蓝调偏差：R=21.9, G=21.4, B=26.2（明显蓝偏）
```

**35 秒帧**的径向渐变甚至达到 **+226.8**，说明这个视频使用了极强的 Bloom/HDR 发光后期处理。

---

### 2.3 视频的时间线

| 时间段 | 特征 | 解读 |
|---|---|---|
| 0-5s | 低运动（4~6），极暗 | 开场/标题 |
| 5-15s | 高运动（16~19），中心运动剧烈 | 相机快速推进到某个光球 |
| 15-25s | 低运动（5~7），降亮度，亮斑减少 | 显示文字/UI 叠加层，或暂停在某帧 |
| 25-35s | 运动增大（7→20），边缘运动爆发 | 相机环绕飞行，展示网络全景 |
| 35-50s | 高运动（20→31），径向渐变极大（+227） | 靠近一个巨大光球，Bloom 极强 |

**结论**：这个视频本质上是一个 **3D 星系网络可视化**，有大量发光粒子节点、密集细线连接、强 Bloom 后处理、相机飞行穿越动画。

---

## 三、Korean-Cosmos 项目当前状态

### 3.1 已有能力（非常强）

Korean-Cosmos 当前已经实现了远超 MVP 级别的功能：

| 模块 | 已实现内容 | 文件 |
|---|---|---|
| 3D 星图渲染 | Three.js + R3F，InstancedMesh 四层渲染 | `WordNodes.tsx` |
| 星球纹理 | Canvas 手绘地球/土星/火星/海王星 | `planet-textures.ts` |
| 星系/行星系统 | 24 个 Solar System + 150+ Planet | `SolarSystemStars.tsx`, `ClusterBubbles.tsx` |
| 语义连线 | Bezier 曲线段，5% 透明度 | `SemanticEdges.tsx` |
| 汉字词连线 | 金色 Bezier 曲线，55% 透明度 | `HanjaEdges.tsx` |
| 选中高亮 | 白色光环 + 放大球体 + 连接线 | `SelectedRing.tsx`, `SelectionEdges.tsx` |
| 词卡标签 | CSS2DRenderer 近景标签 | `WordLabels.tsx` |
| 相机飞行 | setLookAt 平滑过渡（系统级/行星级/单词级）| `CameraRig.tsx` |
| 后处理 | Bloom 强度 2.5，阈值 0.04 | `GalaxyScene.tsx` |
| 星空背景 | 12000 星星粒子 | `Stars` (drei) |
| 词形爆炸图 | 动词/形容词 Radial 展开 | `WordExplosion.tsx` |
| 学习进度集成 | 掌握/学习中/新词 状态驱动渲染 | `learningStore.ts` |
| 系统导航面板 | 24 系统列表 UI | `SystemsPanel` |
| 深色 UI 叠加 | 玻璃质感的顶部按钮、面包屑 | `GalaxyScene.tsx` |

---

### 3.2 当前 Bloom 配置

```tsx
<EffectComposer>
  <Bloom
    intensity={2.5}
    luminanceThreshold={0.04}
    luminanceSmoothing={0.88}
    mipmapBlur
  />
</EffectComposer>
```

---

## 四、核心差距分析

### 差距 1：Bloom/光球强度 ⭐⭐⭐⭐⭐

**视频**：中心径向渐变 +90 ~ +227，说明 Bloom 极强，光球周围有明显的弥散光晕。  
**Korean-Cosmos**：Bloom intensity=2.5，threshold=0.04。虽然不算低，但对比那个视频还不够"炸裂"。

**原因**：

- 视频中的光球是纯白/高亮粒子叠加超大半径 Bloom，中心几乎过曝。
- Korean-Cosmos 目前使用的是纹理球体（Earth/Saturn/Mars/Neptune），它们本身颜色偏暗（海洋蓝、土星金、火星红、海王星青），Bloom 对这些暗色纹理的响应不如纯白亮球强烈。

**建议策略**（按优先级）：

```
1. 提高 Bloom intensity 从 2.5 → 4.0~6.0
2. 降低 luminanceThreshold 从 0.04 → 0.01~0.02
3. 给 WordNodes 添加一层额外的纯白半透明 corona mesh
4. 给 SolarSystemStars 增大 glow corona 透明度
5. 使用 emissive 属性让 InstancedMesh 的球体自发光（不是只靠 Phong 反射）
```

**具体方案**：在 `WordNodes` 的每个 InstancedMesh 材质中添加 `emissive` 属性：

```tsx
<meshPhongMaterial
  map={tex}
  vertexColors
  shininess={12}
  specular={new THREE.Color(0.08, 0.08, 0.08)}
  emissive={new THREE.Color(0.3, 0.3, 0.5)}  // ★ 新增：让每个词节点自发光
  emissiveIntensity={0.8}                       // ★ 新增
  toneMapped={false}
/>
```

---

### 差距 2：连线密度和质感 ⭐⭐⭐⭐

**视频**：15-18% 的像素是薄边缘，意味着非常密集的细线网络。线是极细的、头发丝一样的。  
**Korean-Cosmos**：语义边只有 5% 透明度，且使用 lineBasicMaterial（webgl lines 默认 1px 宽，没有粗细变化）。

**差距所在**：

| 维度 | 视频 | Korean-Cosmos |
|---|---|---|
| 连线数量 | 极密集（15-18% 像素是边） | 稀疏（每个 cluster 仅 5 条边） |
| 线宽 | 极细，头发丝感 | 1px，无变化 |
| 透明度 | 随距离渐变 | 固定 5% |
| 颜色 | 蓝白冷色调 | 浅蓝白 (#c8d8ff) |
| 形式 | 直线 | Bezier 曲线 |

**建议**：

```
1. 增加每条 cluster 内的连线数（当前仅 5 条 → 15-20 条）
2. 减少当前 0.22 的 arcBias，让线更直、更像视频中的密集网络
3. 使用 ThinLine 或 Line2（drei/Line）实现真正的细线宽度
4. 根据相机距离动态调整连线透明度
```

---

### 差距 3：节点渲染方式 ⭐⭐⭐⭐

**视频**：节点是纯白/亮色光点，带柔软光晕，像星星一样的点光源。  
**Korean-Cosmos**：节点是带纹理的 3D 球体（Earth/Saturn/Mars/Neptune）。

**这不是好坏问题，是两种完全不同的视觉哲学**：

- **视频风格**：极简星图，每个节点是抽象光球，重点是关系网络。
- **Korean-Cosmos 风格**：教育可视化，每个节点是可识别的星球，重点是分类和知识。

**如果你想要视频那种"光球"效果**，建议：

```
1. 在现有纹理球体外叠加一层纯白半透明晕轮（corona mesh）
2. 让 corona 的透明度随 Bloom 强度变化
3. 远距离缩放时，纹理球退化为纯白发光点（LOD）
4. 给每个节点添加 PointLight 或使用自发光材质
```

---

### 差距 4：相机运动 ⭐⭐⭐

**视频**：连续飞行/环绕运动，像在太空中漂浮。  
**Korean-Cosmos**：离散的点击触发的 setLookAt 过渡。

**差距**：

- 视频的相机在没人操作时也在持续缓慢旋转/飞行。
- Korean-Cosmos 的相机只在用户交互时才移动。

**建议**：

在 `CameraRig` 中添加 idle 模式的自动环绕：

```tsx
// 当用户未交互超过 5 秒，自动进入 slow orbit
useFrame((_, dt) => {
  if (idle && controlsRef.current) {
    controlsRef.current.azimuthRotate(dt * 0.15);  // 缓慢水平旋转
  }
});
```

---

### 差距 5：粒子/背景丰富度 ⭐⭐

**视频**：背景有弥漫的星云粒子。  
**Korean-Cosmos**：只有 drei/Stars 的 12000 颗标准星星。

**建议**：

```tsx
// 增加一层雾状星云粒子
<Stars radius={8000} depth={600} count={30000} factor={8} saturation={0.2} fade speed={0.1} />
// 再加一层极远处微弱的彩色星云
<Stars radius={12000} depth={1000} count={5000} factor={2} saturation={0.5} fade speed={0.05} />
```

---

### 差距 6：中间"光球"效果 ⭐⭐⭐⭐⭐

视频在 20-25s 时有一个非常明显的**大光球**（最亮斑半径≈35px，整体画面极度暗但有一个巨大发光中心）。

**当前 Korean-Cosmos 没有等价物**。

最接近的是：

- `SolarSystemStars` 的 System Star（半径 11 的球体 + 半径 26 的辉光 corona，透明度 0.06）
- `SelectedRing` 的选中光环

但两者都不够"爆"。

**建议添加一个"光球模式"**：

可以在 `SolarSystemStars` 的基础上提升 corona 效果：

```tsx
// 多层发光晕轮
<mesh>
  <sphereGeometry args={[60, 12, 12]} />          {/* 超大晕轮 */}
  <meshBasicMaterial color={color} transparent opacity={0.03} toneMapped={false} depthWrite={false} />
</mesh>
<mesh>
  <sphereGeometry args={[38, 10, 10]} />          {/* 中号晕轮 */}
  <meshBasicMaterial color={color} transparent opacity={0.08} toneMapped={false} depthWrite={false} />
</mesh>
```

---

## 五、差距优先级总览

| 差距 | 影响程度 | 修改工作量 | 立即做？ |
|---|---|---|---|
| Bloom 强度不够 | 🔴 高（光球不亮） | 小（改参数） | ✅ 立即 |
| 连线太稀疏/太粗 | 🔴 高（没有密集网络感） | 中 | ✅ 立即 |
| 节点没有发光晕轮 | 🟡 中（纹理球已经很漂亮） | 中 | 可延后 |
| 相机无自动飞行 | 🟡 中（影响演示感） | 小 | 可延后 |
| 背景粒子简单 | 🟢 低 | 小 | 可延后 |
| 缺"大光球"效果 | 🟡 中 | 中 | 可延后 |

---

## 六、立即可执行的改进方案

### 6.1 Bloom 参数调整

修改 `GalaxyScene.tsx` 中的 EffectComposer：

```tsx
<EffectComposer>
  <Bloom
    intensity={5.0}              // 从 2.5 提升到 5.0
    luminanceThreshold={0.015}   // 从 0.04 降低到 0.015
    luminanceSmoothing={0.75}   // 从 0.88 微降到 0.75
    mipmapBlur
  />
</EffectComposer>
```

**效果**：所有发光物体（stars、system stars、planet orbs）会显著更亮更大，接近视频的"光球弥散"感。

---

### 6.2 增加连线密度

修改 `GalaxyScene.tsx` 中 `useClusterEdges` 函数：

```tsx
function useClusterEdges(nodes: MapNode[]): MapEdge[] {
  return useMemo(() => {
    const byPlanet = new Map<number, MapNode[]>();
    for (const n of nodes) {
      const arr = byPlanet.get(n.cluster_id) ?? [];
      arr.push(n);
      byPlanet.set(n.cluster_id, arr);
    }
    const edges: MapEdge[] = [];
    for (const [cid, pNodes] of byPlanet) {
      const count = Math.min(20, pNodes.length - 1);  // 从 5→20
      for (let i = 0; i < count; i++) {
        edges.push({
          id: `pl-${cid}-${i}`,
          source: pNodes[i].id,
          target: pNodes[(i + 1) % pNodes.length].id,
          relation_type: 'SAME_TOPIC',
          strength: 0.12,          // 从 0.2 降低
          visible_by_default: true,
        });
      }
    }
    return edges;
  }, [nodes]);
}
```

同时修改 `SemanticEdges.tsx`：

```tsx
<lineBasicMaterial
  color="#aaccff"           // 从 #c8d8ff 微调偏冷蓝
  transparent
  opacity={0.08}             // 从 0.05 提升
  depthWrite={false}
/>
```

---

### 6.3 给节点增加自发光

修改 `WordNodes.tsx` 中的 Phong 材质：

```tsx
<meshPhongMaterial
  map={tex}
  vertexColors
  shininess={12}
  specular={new THREE.Color(0.08, 0.08, 0.08)}
  emissive={new THREE.Color(0.25, 0.30, 0.45)}
  emissiveIntensity={0.6}
  toneMapped={false}
/>
```

---

### 6.4 提高 System Star 发光

修改 `SolarSystemStars.tsx` 的 corona：

```tsx
{/* Far glow corona — 增大尺寸和透明度 */}
<mesh ref={outerRef}>
  <sphereGeometry args={[45, 12, 12]} />     {/* 从 26 增大到 45 */}
  <meshBasicMaterial color={color} transparent opacity={0.10} toneMapped={false} depthWrite={false} />
</mesh>

{/* 再加一层超大极淡晕轮 */}
<mesh>
  <sphereGeometry args={[75, 8, 8]} />
  <meshBasicMaterial color={color} transparent opacity={0.03} toneMapped={false} depthWrite={false} />
</mesh>
```

---

## 七、结论

### 不是追赶不上的差距，而是两种视觉方向

| | 视频 | Korean-Cosmos |
|---|---|---|
| 风格 | 极简抽象光球星图 | 教育型星球知识图谱 |
| 节点 | 纯白发光点 | 纹理 3D 行星 |
| 连线 | 极密集细线网络 | 稀疏贝塞尔曲线 |
| 光效 | 超强中心过曝 Bloom | 中等 Bloom |
| 交互 | 自动飞行展示 | 触发性相机跳转 |
| 数据 | 单一层级 | 三层（系统→行星→单词）|

**Korean-Cosmos 实际上比视频更复杂、功能更多**。差距主要在 **视觉冲击力**（Bloom 强度和连线密度），而非功能。

### 最快拉近视觉差距的建议

```txt
1. Bloom intensity: 2.5 → 5.0（1 行代码）
2. 连线数量: 5 → 20 条/cluster（改一个数字）
3. 连线透明度: 0.05 → 0.08（改一个数字）
4. 节点添加 emissive（改 3 行代码）
5. System Star corona 增大（改 2 个数字）
```

这 5 个改动加起来不到 **10 行代码**，就能显著拉近和视频的视觉效果。
