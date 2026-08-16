## poi-plugin-item-stock

基于 [poi-plugin-information-center](https://github.com/Greesea/poi-plugin-information-center) 精简重写的 poi 插件，只保留「常用」标签页（道具库存 / 消耗品一览）。

### 功能

- 道具库存列表：显示每种消耗品的图标与数量
- 家具兑换计算：家具箱（10/11/12 号物品）额外显示可兑换的家具币数量（1x / 10x / 半数 / 总数）
- 收藏置顶：点击星标收藏常用物品，收藏状态自动保存，收藏的物品排在列表前面

### 安装

将 `poi-plugin-item-stock` 目录放入 poi 的插件目录后，在 poi 设置中启用即可。

### 说明

- 物品图标从游戏服务器拉取（`/kcs2/img/common/common_itemicons.png`）
- 收藏数据保存在 poi 配置中：`plugin.poi-plugin-item-stock.pluginSettings.tabs.common.useItemsFavourites`

### License

MIT，版权归原作者 Greesea 所有。
