<template>
    <div class="rounded-2xl mb-2" v-if="accountInfo">
        <div class="mx-3 my-2">
            <div class="border-4 border-sky-500 rounded-xl p-2">
                <h4 class="text-lg font-bold">公告</h4>
                <hr class="border-gray-400 dark:border-gray-600 my-2" />
                <div v-if="notifications">
                    <p class="break-word whitespace-pre-wrap">{{ notifications }}</p>
                </div>
                <svg class="animate-spin h-5 w-5 dark:text-gray-100 text-sky-500" v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        </div>
        <div class="p-3 flex flex-col justify-between gap-2">
            <div class="flex flex-col">
                <div class="flex flex-col 3xs:flex-row justify-start gap-2">
                    <div class="flex flex-col min-w-[90px]">
                        <span class="text-2xl max-w-[250px] overflow-hidden truncate">{{ accountInfo.name }}</span>
                        <span class="text-sm max-w-[250px] overflow-hidden truncate">{{ accountInfo.email }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <div class="dark:text-gray-100 border-l-4 border-l-sky-500 dark:border-l-sky-800 px-3 py-0.5 mx-1 uppercase font-bold text-sm">
                            {{ accountInfo.role }}
                        </div>
                        <div class="text-sm border-l-4 dark:text-gray-100 border-l-green-600 dark:border-l-green-800 px-3 py-0.5 mx-1 uppercase font-bold">uid: {{ accountInfo.uid }}</div>
                    </div>
                </div>
            </div>
            <!--see u avatar wall-->
            <!--<div v-if="tbaccounts.length > 0" class="mt-3 ml-5">
                <img
                    v-for="tbaccount in tbaccounts"
                    :key="tbaccount.portrait"
                    :src="'https://himg.bdimg.com/sys/portraitn/item/' + tbaccount.portrait"
                    :alt="'avatar-' + tbaccount.name + '-' + tbaccount.portrait"
                    :title="tbaccount.name + '的头像'"
                    class="w-14 h-14 transition-all -ml-5 hover:mr-7 rounded-2xl my-1 inline-block ring-2 ring-gray-550 bg-gray-300 dark:bg-gray-700"
                    loading="lazy"
                />
            </div>-->
        </div>
        <div class="p-3">
            <h3 class="text-xl mb-3">签到状态</h3>
            <div class="grid grid-cols-2 gap-2">
                <ul class="col-span-2 md:col-span-1 list-disc list-inside">
                    <li class="marker:text-green-500">
                        <span class="font-bold">成功：</span><span class="font-mono">{{ checkinStatus.success || 0 }}</span>
                    </li>
                    <li class="marker:text-pink-500">
                        <span class="font-bold">失败：</span><span class="font-mono">{{ checkinStatus.failed || 0 }}</span>
                    </li>
                    <li class="marker:text-orange-500">
                        <span class="font-bold">等待：</span><span class="font-mono">{{ checkinStatus.waiting || 0 }}</span>
                    </li>
                    <li class="marker:text-gray-600 dark:marker:text-gray-400">
                        <span class="font-bold">忽略：</span><span class="font-mono">{{ checkinStatus.ignore || 0 }}</span>
                    </li>
                </ul>
                <ul class="col-span-2 md:col-span-1 list-disc list-inside">
                    <li class="marker:text-sky-500">
                        <span class="font-bold">账号数量：</span><span class="font-mono">{{ tbaccounts.length || 0 }}</span>
                    </li>
                    <li class="marker:text-sky-500">
                        <span class="font-bold">贴吧数量：</span><span class="font-mono">{{ checkinStatus.forum_count || 0 }}</span>
                    </li>
                </ul>
            </div>
        </div>
        <hr class="border-gray-400 dark:border-gray-600 px-3 my-3" />
        <div class="inline-block md:block">
            <Modal class="inline-block" title="个人设置">
                <template #default>
                    <button class="inline-block my-1 px-5 mx-1 rounded-full transition-colors hover:bg-sky-600 dark:hover:bg-sky-400 bg-sky-500 text-gray-100 py-2">个人设置</button>
                </template>
                <template #container>
                    <form class="p-3 flex flex-col gap-2" v-if="accountInfo">
                        <label class="block my-1" for="username">用户名</label>
                        <input
                            id="username"
                            autocomplete="username"
                            type="text"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.username"
                        />
                        <label class="block my-1" for="email">邮箱</label>
                        <input
                            id="email"
                            autocomplete="email"
                            type="email"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.email"
                        />
                        <!--<abbr class="block my-1" title="忘记了原密码？试试退出后使用找回密码">密码</abbr>-->
                        <label class="block my-1">密码</label>
                        <input
                            type="password"
                            placeholder="当前密码"
                            autocomplete="current-password"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.password"
                        />
                        <input
                            type="password"
                            placeholder="新密码（留空不修改）"
                            autocomplete="new-password"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.new_password"
                        />

                        <hr class="border-gray-400 dark:border-gray-600 px-3 my-3" />

                        <label class="my-1 flex justify-between" for="bark-key"> Bark key </label>
                        <details role="button" class="text-sm">
                            <summary>关于Bark</summary>
                            <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                                <li>Bark 仅支持 <a href="https://apps.apple.com/us/app/bark-customed-notifications/id1403753865" target="_blank" class="underline underline-offset-2">iOS/iPadOS 操作系统</a></li>
                                <li>
                                    本站使用的端点为 <span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{ accountInfo?.system_settings?.bark_addr }}</span
                                    >{{ accountInfo?.system_settings?.bark_addr === 'https://api.day.app' ? '(官服)' : '' }}
                                </li>
                            </ul>
                        </details>
                        <input
                            id="bark-key"
                            type="text"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.bark_key"
                        />
                        <label class="my-1 flex justify-between" for="ntfy-topic"> Ntfy topic </label>
                        <details role="button" class="text-sm">
                            <summary>关于Ntfy</summary>
                            <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                                <li><a href="https://ntfy.sh" target="_blank" class="underline underline-offset-2">Ntfy.sh</a> 支持 Android/iOS/iPadOS/网页推送</li>
                                <li>
                                    任何人都可以访问<span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{
                                        accountInfo?.system_settings?.ntfy_addr + '/' + (settingsValue.ntfy_topic ? settingsValue.ntfy_topic : '${ntfy_topic}')
                                    }}</span
                                    >取得历史推送，所以建议将此值设置得尽可能地长
                                </li>
                                <li>
                                    本站使用的端点为 <span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{ accountInfo?.system_settings?.ntfy_addr }}</span
                                    >{{ accountInfo?.system_settings?.ntfy_addr === 'https://ntfy.sh' ? '(官服)' : '' }}
                                </li>
                            </ul>
                        </details>
                        <input
                            id="ntfy-topic"
                            type="text"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.ntfy_topic"
                        />

                        <label class="my-1 flex justify-between" for="pushdeer-key"> PushDeer key </label>
                        <details role="button" class="text-sm">
                            <summary>关于 Pushdeer</summary>
                            <ul role="list" class="mb-3 marker:text-sky-500 list-disc list-inside">
                                <li><a href="https://www.pushdeer.com/" target="_blank" class="underline underline-offset-2">PushDeer</a> 支持多种客户端</li>
                                <li>
                                    本站使用的端点为 <span class="break-all font-mono mx-2 text-gray-100 bg-gray-800 py-1 px-2 rounded-lg select-all">{{ accountInfo?.system_settings?.pushdeer_addr }}</span
                                    >{{ accountInfo?.system_settings?.pushdeer_addr === 'https://api2.pushdeer.com' ? '(官服)' : '' }}
                                </li>
                            </ul>
                        </details>
                        <input
                            id="pushdeer-key"
                            type="text"
                            class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.pushdeer_key"
                        />

                        <label class="block my-1" for="push-type">首选推送渠道</label>
                        <select
                            id="push-type"
                            class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.push_type"
                        >
                            <option value="email">邮箱</option>
                            <option value="ntfy">Ntfy</option>
                            <option value="bark">Bark</option>
                            <option value="pushdeer">PushDeer</option>
                        </select>

                        <label class="block my-1" for="push-type"
                            >推送每日签到报告{{ (accountInfo?.system_settings?.go_daily_report_hour || -1) > -1 ? '（' + accountInfo.system_settings.go_daily_report_hour + ' 时开始推送）' : '（站点未开启每日报告）' }}</label
                        >
                        <select
                            id="push-type"
                            class="form-select placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                            v-model="settingsValue.daily_report"
                        >
                            <option value="0">关闭</option>
                            <option value="1">开启</option>
                        </select>

                        <input
                            v-if="settingsValue.password !== ''"
                            type="submit"
                            role="button"
                            class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors"
                            @click="saveSettings"
                            value="保存"
                        />
                        <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>请填写密码</button>
                    </form>
                </template>
            </Modal>
            <Modal
                v-if="accountInfo?.system_settings?.allow_export_personal_data === '1' || accountInfo?.system_settings?.allow_import_personal_data === '1'"
                class="inline-block"
                title="备份"
                @active-callback="
                    () => {
                        settingsValue.password = ''
                        backupFileData = {}
                    }
                "
            >
                <template #default>
                    <button class="inline-block my-1 px-5 mx-1 rounded-full transition-colors hover:bg-sky-600 dark:hover:bg-sky-400 bg-sky-500 text-gray-100 py-2">备份</button>
                </template>
                <template #container>
                    <div v-if="accountInfo">
                        <div class="my-1">
                            <button
                                v-if="accountInfo?.system_settings?.allow_export_personal_data === '1'"
                                :class="'mr-1 rounded px-2 hover:bg-sky-500 hover:text-gray-200 transition-colors ' + (backupStatus === 'export' ? 'bg-sky-500 text-gray-200' : '')"
                                @click="backupStatus = 'export'"
                            >
                                导出
                            </button>
                            <button
                                v-if="accountInfo?.system_settings?.allow_import_personal_data === '1'"
                                :class="'mr-1 rounded px-2 hover:bg-sky-500 hover:text-gray-200 transition-colors ' + (backupStatus === 'import' ? 'bg-sky-500 text-gray-200' : '')"
                                @click="backupStatus = 'import'"
                            >
                                导入
                            </button>
                        </div>
                        <form v-if="backupStatus === 'export'" class="flex flex-col gap-2 mt-3">
                            <!--<label for="user-export-plugin" class="font-bold">选择插件</label>
                            <select
                                id="user-export-plugin"
                                multiple
                                v-model="resetPluginName"
                                class="form-multiselect placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-gray-100 form-select block w-full mt-2 mb-3 h-48"
                            >
                                <option v-for="(pluginInfo, pluginName) in pluginList" :key="pluginName" :value="pluginName">{{ pluginInfo.plugin_name_cn }}</option>
                            </select>-->
                            <ul role="list" class="my-1 marker:text-pink-500 list-disc list-inside text-sm">
                                <li>导出数据包括网站设置，百度账号和贴吧，以及插件设置和记录</li>
                                <li>所有内容都会以明文导出，请注意数据安全</li>
                            </ul>
                            <hr class="border-gray-400 dark:border-gray-600 my-1" />
                            <label class="block" for="export-backup-password">密码</label>
                            <input
                                id="export-backup-password"
                                type="password"
                                placeholder="当前密码"
                                autocomplete="current-password"
                                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                v-model="settingsValue.password"
                            />
                            <input
                                v-if="settingsValue.password !== ''"
                                type="submit"
                                role="button"
                                class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors"
                                @click="
                                    (e) => {
                                        e.preventDefault()
                                        exportAccount(settingsValue.password)
                                    }
                                "
                                value="确认导出"
                            />
                            <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>请填写密码</button>
                        </form>

                        <form v-else-if="backupStatus === 'import'" class="flex flex-col gap-2" v-if="accountInfo">
                            <ul role="list" class="my-1 marker:text-pink-500 list-disc list-inside text-sm">
                                <li>批量导入数据时不会检查百度账号有效性，请自行提前检查</li>
                                <li>导入失败可能不会有提示</li>
                                <li>导入程序使用<span class="font-bold">仅新增</span>模式合并贴吧列表</li>
                                <li>如果相关项目有容量上限，会丢弃超出的部分</li>
                                <li>备份内容会覆盖个人设置</li>
                                <li>导入后的顺序可能会有变化</li>
                            </ul>
                            <hr class="border-gray-400 dark:border-gray-600 my-1" />
                            <label class="block" for="upload-backup-data">
                                <span>备份文件</span>
                                <div
                                    :class="{
                                        'my-2 border-4 rounded-xl transition-all h-full min-h-10 text-center cursor-pointer border-gray-400 ': true,
                                        'hover:bg-gray-100 hover:dark:bg-gray-900 hover:border-dotted ': true,
                                        'bg-gray-100 dark:bg-gray-900 border-dotted ': dragStatus,
                                        'border-dashed': !dragStatus
                                    }"
                                    @dragenter="dragEvent"
                                    @dragleave="dragEvent"
                                    @dragover="dragEvent"
                                    @drop="dropEvent"
                                >
                                    <div class="py-8 pointer-events-none select-none">
                                        <div class="text-xl">{{ dragStatus ? '释放以读取备份文件' : Object.keys(backupFileData).length > 0 ? '点击，或拖动备份文件到这里更新' : '点击，或拖动备份文件到这里释放' }}</div>
                                    </div>
                                </div>

                                <input
                                    type="file"
                                    class="sr-only"
                                    accept="application/json"
                                    id="upload-backup-data"
                                    lang="zh"
                                    @change="
                                        async (e) => {
                                            e.preventDefault()
                                            loadingBackupData()
                                        }
                                    "
                                />
                            </label>
                            <div v-if="backupFileKeys.length > 0">
                                <span>已读取的备份</span>
                                <div class="my-2 rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3 relative" v-for="backupTableName in backupFileKeys" :key="backupTableName">
                                    <h5 class="font-bold text-xl" :title="priorityOrder[backupTableName] !== undefined ? '核心备份' : '插件备份'">
                                        {{ backupTableName }}
                                        <uno-icon v-if="priorityOrder[backupTableName] !== undefined" class="i-fluent-emoji-flat:high-voltage inline-block -mt-1" style="width: 1em; height: 1em" />
                                    </h5>
                                    <Modal class="inline-block" :title="'表 ' + backupTableName" :nested_modal="true">
                                        <template #default>
                                            <span class="hover:underline underline-offset-1 cursor-pointer">{{ (backupFileData[backupTableName] || []).length }} 条记录</span>
                                        </template>
                                        <template #container>
                                            <div class="rounded-lg bg-gray-300 dark:bg-gray-800 px-5 py-3 mb-3 relative" v-for="(backupItem, index) in backupFileData[backupTableName] || []" :key="backupItem.id">
                                                <h5 class="font-bold text-xl">
                                                    ID: {{ backupItem.id }}
                                                    <SvgCheck v-if="backupTableName === 'tc_baiduid' && tbPortraits.includes(backupItem.portrait)" height="0.9em" width="0.9em" class="inline-block -mt-1 ml-2" title="账号已存在" />
                                                </h5>
                                                <ul role="list" class="my-1 marker:text-sky-500 list-disc list-inside transition-all">
                                                    <li v-for="(v, k) in backupItem" :key="backupTableName" class="truncate w-full">
                                                        <span class="font-bold">{{ k }}: </span><span class="font-mono">{{ v }}</span>
                                                    </li>
                                                </ul>
                                                <button
                                                    class="text-pink-500 hover:text-pink-600 absolute right-3 top-3 rounded-full transition-colors"
                                                    @click="
                                                        (e) => {
                                                            e.preventDefault()
                                                            backupFileData[backupTableName] = [...backupFileData[backupTableName].slice(0, index), ...backupFileData[backupTableName].slice(index + 1)]
                                                        }
                                                    "
                                                >
                                                    <uno-icon class="i-bi:x-circle-fill" style="width: 1.5em; height: 1.5em" />
                                                </button>
                                            </div>
                                        </template>
                                    </Modal>
                                    <button
                                        v-if="backupTableName !== 'tc_baiduid'"
                                        class="text-pink-500 hover:text-pink-600 absolute right-3 top-3 rounded-full transition-colors"
                                        @click="
                                            (e) => {
                                                e.preventDefault()
                                                deleteBackupTable(backupTableName)
                                            }
                                        "
                                    >
                                        <uno-icon class="i-bi:x-circle-fill" style="width: 1.5em; height: 1.5em" />
                                    </button>
                                </div>
                            </div>
                            <label class="block" for="restore-backup-password">密码</label>
                            <input
                                id="restore-backup-password"
                                type="password"
                                placeholder="当前密码"
                                autocomplete="current-password"
                                class="placeholder-slate-400 contrast-more:border-slate-400 contrast-more:placeholder-slate-500 w-full bg-gray-100 dark:bg-gray-900 dark:text-gray-100 rounded-xl"
                                v-model="settingsValue.password"
                            />
                            <input
                                v-if="settingsValue.password !== ''"
                                type="submit"
                                role="button"
                                class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-sky-500 hover:bg-sky-400 dark:hover:bg-sky-600 text-xl transition-colors"
                                @click="
                                    (e) => {
                                        e.preventDefault()
                                        importAccount(settingsValue.password)
                                    }
                                "
                                value="确认导入"
                            />
                            <button v-else-if="backupFileKeys.length > 0" role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>请填写密码</button>
                            <button v-else role="button" class="text-gray-100 mt-3 rounded-lg px-3 py-1 bg-gray-400 dark:bg-gray-500 text-xl transition-colors" disabled>备份数据无效</button>
                        </form>
                        <div v-else>本网站不支持备份</div>
                    </div>
                </template>
            </Modal>
            <Modal
                title="重置插件"
                class="inline-block"
                @active-callback="
                    () => {
                        resetPluginName = ''
                        resetPid = 0
                    }
                "
            >
                <template #default>
                    <button class="inline-block my-1 px-5 mx-1 rounded-full transition-colors hover:bg-orange-600 dark:hover:bg-orange-400 bg-orange-500 text-gray-100 py-2">重置插件</button>
                </template>
                <template #container>
                    <ul class="mb-3 col-span-2 md:col-span-1 marker:text-sky-500 list-disc list-inside text-sm">
                        <li>确认后将会清空本账号对应插件本日的签到状态，稍后将会自动重签。</li>
                        <li>短时间内频繁提交可能会导致对应的账号被封禁，请谨慎使用本功能。</li>
                        <li>部分插件无需重置状态，会一直返回成功</li>
                    </ul>

                    <label for="user-reset-plugin" class="font-bold">选择插件</label>
                    <select id="user-reset-plugin" v-model="resetPluginName" class="rounded-xl bg-gray-100 dark:bg-gray-800 dark:text-gray-100 form-select block w-full mt-2 mb-3">
                        <option v-for="(pluginInfo, pluginName) in pluginList" :key="pluginName" :value="pluginName">{{ pluginInfo.plugin_name_cn }}</option>
                    </select>

                    <div class="my-3">
                        <label for="pid-to-plugin-reset">账号</label>
                        <select id="pid-to-plugin-reset" v-model="resetPid" class="bg-gray-200 dark:bg-gray-900 dark:text-gray-100 form-select block w-full mt-1 rounded-xl">
                            <option :key="0" :value="0">全选</option>
                            <option v-for="(name, pid) in pidNameKV" :key="pid" :value="pid">{{ name }}</option>
                        </select>
                    </div>

                    <button class="bg-pink-500 hover:bg-pink-600 dark:hover:bg-pink-400 px-3 py-1 rounded-lg transition-colors text-gray-100 w-full text-lg" @click="resetPluginStatus(resetPluginName)">确认</button>
                </template>
            </Modal>
            <NuxtLink role="button" class="inline-block my-1 px-5 mx-1 rounded-full transition-colors hover:bg-pink-600 dark:hover:bg-pink-400 bg-pink-500 text-gray-100 py-2" to="/signin" @click="logout"> 登出 </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Notice, Request, DownloadFile, ReadFileData } from '~/share/Tools'

const store = useMainStore()

const accountInfo = computed(() => store.cache?.accountInfo)
const pidNameKV = computed(() => store.pidNameKV)
const tbaccounts = computed(() => store.cache?.accounts || [])
const pluginList = computed(() => store.cache?.plugin_list || {})
const notifications = ref<string>('')
const runtimeConfig = useRuntimeConfig()

const tbPortraits = computed(() => tbaccounts.value.map((tba) => tba.portrait))

watch(accountInfo, () => {
    settingsValue.email = accountInfo.value?.email || ''
    settingsValue.username = accountInfo.value?.name || ''

    settingsValue.bark_key = accountInfo.value?.bark_key || ''
    settingsValue.pushdeer_key = accountInfo.value?.pushdeer_key || ''
    settingsValue.ntfy_topic = accountInfo.value?.ntfy_topic || ''
    settingsValue.push_type = accountInfo.value?.push_type || ''
    settingsValue.daily_report = accountInfo.value?.daily_report || '0'
})

const settingsValue = reactive<{
    username: string
    email: string
    password: string
    new_password: string
    ntfy_topic: string
    bark_key: string
    pushdeer_key: string
    push_type: string
    daily_report: '' | '0' | '1'
}>({
    username: '',
    email: '',
    password: '',
    new_password: '',

    ntfy_topic: '',
    bark_key: '',
    pushdeer_key: '',
    push_type: '',
    daily_report: '0'
})

const checkinStatus = ref({})

const GetNotifications = () =>
    Request(store.basePath + '/notifications', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            return
        }
        notifications.value = res.data || '没有公告'
        //console.log(res)
    })

const GetCheckinStatus = () =>
    Request(store.basePath + '/list/status', {
        headers: {
            Authorization: store.authorization
        }
    }).then((res) => {
        if (res.code !== 200) {
            return
        }
        checkinStatus.value = res.data || {}
        //console.log(res)
    })

onMounted(async () => {
    // get account info
    if (store.rawAuthorization !== '') {
        await GetNotifications()
        await GetCheckinStatus()

        settingsValue.email = accountInfo.value?.email || ''
        settingsValue.username = accountInfo.value?.name || ''
        settingsValue.bark_key = accountInfo.value?.bark_key || ''
        settingsValue.pushdeer_key = accountInfo.value?.pushdeer_key || ''
        settingsValue.ntfy_topic = accountInfo.value?.ntfy_topic || ''
        settingsValue.push_type = accountInfo.value?.push_type || ''
        settingsValue.daily_report = accountInfo.value?.daily_report

        if (accountInfo.value?.system_settings?.allow_export_personal_data !== '1' && accountInfo.value?.system_settings?.allow_import_personal_data === '1') {
            backupStatus.value = 'import'
        } else if (accountInfo.value?.system_settings?.allow_export_personal_data !== '1' && accountInfo.value?.system_settings?.allow_import_personal_data !== '1') {
            backupStatus.value = 'none'
        }
    }
})

const saveSettings = (e: Event) => {
    e.preventDefault()
    if (settingsValue.username || settingsValue.email) {
        // change email
        Request(store.basePath + '/passport/update/info', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({
                username: settingsValue.username,
                email: settingsValue.email,
                ntfy_topic: settingsValue.ntfy_topic,
                bark_key: settingsValue.bark_key,
                pushdeer_key: settingsValue.pushdeer_key,
                push_type: settingsValue.push_type,
                daily_report: settingsValue.daily_report === '1' ? '1' : '0',
                password: settingsValue.password
            }).toString()
        }).then((res) => {
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice('信息修改成功', 'success')
            const newAccountInfo = JSON.parse(JSON.stringify(accountInfo.value))
            newAccountInfo.email = res.data.email
            newAccountInfo.name = res.data.name
            newAccountInfo.avatar = res.data.avatar

            newAccountInfo.ntfy_topic = res.data.ntfy_topic
            newAccountInfo.bark_key = res.data.bark_key
            newAccountInfo.pushdeer_key = res.data.pushdeer_key
            newAccountInfo.push_type = res.data.push_type
            newAccountInfo.daily_report = res.data.daily_report
            store.updateCache('accountInfo', newAccountInfo)
            //console.log(res)
        })
    }
    if (settingsValue.password.length > 0 && settingsValue.new_password.length > 0 && settingsValue.password !== settingsValue.new_password) {
        // change pwd
        Request(store.basePath + '/passport/update/password', {
            headers: {
                Authorization: store.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'PUT',
            body: new URLSearchParams({ old_password: settingsValue.password, new_password: settingsValue.new_password }).toString()
        }).then((res) => {
            if (res.code !== 200 && res.code !== 201 && res.code !== 204) {
                Notice(res.message, 'error')
                return
            }
            Notice('密码修改成功', 'success')
            let token = res.data.token
            if (runtimeConfig.public.NUXT_BASE_PATH && runtimeConfig.public.NUXT_USE_COOKIE_TOKEN) {
                token = 'cookie-token'
            }
            store.updateAuthorization(token)
            //console.log(res)
        })
    } else if (settingsValue.password === settingsValue.new_password) {
        //console.log('same password!')
    }
}

const logout = () => {
    fetch(store.basePath + '/passport/logout', {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 200 && res.code !== 401) {
                return
            }
            store.logout()
            //console.log(res)
            navigateTo('/signin')
        })
}

const updateAccoutList = () => {
    Request(store.basePath + '/account?array_mode=1', {
        headers: {
            Authorization: store.authorization
        }
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                return
            }
            store.updateCache(
                'accounts',
                (res.data || []).map((account) => ({
                    id: account[0],
                    uid: account[1],
                    name: account[2],
                    portrait: account[3],
                    page: 0,
                    more: false,
                    filter: 'all',
                    search: ''
                }))
            )
            //console.log(res)
        })
        .catch((e) => {
            Notice(e.toString(), 'error')
        })
}

const backupStatus = ref<string>('export') // import
const backupFileData = ref<{ [p in string]: any }>({})

const priorityOrder: Record<string, number> = {
    tc_baiduid: 0,
    tc_tieba: 1,
    tc_users_options: 2
}

const backupFileKeys = computed(() => {
    return Object.keys(backupFileData.value).sort((a, b) => {
        const pa = priorityOrder[a]
        const pb = priorityOrder[b]

        const aHas = pa !== undefined
        const bHas = pb !== undefined

        if (aHas && bHas) return pa - pb
        if (aHas) return -1
        if (bHas) return 1

        return a.localeCompare(b)
    })
})

const deleteBackupTable = (tableName: string) => {
    if (tableName === 'tc_baiduid') {
        Notice('不能删除表 tc_baiduid', 'error')
    } else {
        delete backupFileData.value[tableName]
    }
}

const loadingBackupData = () => {
    backupFileData.value = {}
    ReadFileData('upload-backup-data')
        .then((res) => {
            for (const table in res) {
                if (table.startsWith('tc_')) {
                    backupFileData.value[table] = res[table]
                    // switch (table) {
                    //     case 'tc_baiduid':
                    //         if (!res[table].some((t) => !(t.portrait && t.stoken && t.bduss && t.id && t.id > 0))) {
                    //             backupFileData.value.tc_baiduid = res.tc_baiduid.map((t) => ({
                    //                 portrait: String(t.portrait),
                    //                 stoken: String(t.stoken),
                    //                 bduss: String(t.bduss),
                    //                 name: String(t.name || ''),
                    //                 id: Number(t.id)
                    //             }))
                    //         }
                    //         break
                    //     case 'tc_tieba':
                    //         if (!res[table].some((t) => !(t.tieba && t.fid && backupFileData.value.tc_baiduid.find((bdid) => bdid.id === t.pid)))) {
                    //             backupFileData.value.tc_tieba = res.tc_tieba.map((t) => ({
                    //                 tieba: String(t.tieba),
                    //                 fid: Number(t.fid || 0),
                    //                 pid: Number(t.pid || 0),
                    //                 no: !!(t.no || false),
                    //                 latest: Number(t.latest || 0),
                    //                 status: Number(t.status || 0),
                    //                 last_error: String(t.last_error || '')
                    //             }))
                    //         }
                    //         break
                    // }
                }
            }
            document.getElementById('upload-backup-data').value = ''
        })
        .catch((err) => {
            console.error(err)
        })
}

const exportAccount = (password = '') => {
    Request(store.basePath + '/passport/export', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            password
        })
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice('导出失败: ' + res.message, 'error')
                return
            }
            Notice('导出成功', 'success')
            DownloadFile(`tbsign_go-export-${accountInfo.value.uid}.json`, JSON.stringify(res.data, null, 4))
        })
        .catch((e) => {
            Notice('导出失败: ' + e, 'error')
        })
}

const importAccount = (password = '') => {
    Request(store.basePath + '/passport/import', {
        headers: {
            Authorization: store.authorization,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: new URLSearchParams({
            password,
            data: JSON.stringify(backupFileData.value)
        })
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice('导入失败: ' + res.message, 'error')
                return
            }
            Notice('导入完成', 'success')
            updateAccoutList()
            GetCheckinStatus()
        })
        .catch((e) => {
            Notice('导入失败: ' + e, 'error')
        })
}

const resetPluginName = ref<string>('')
const resetPid = ref<number>(0)
const resetPluginStatus = () => {
    if (!resetPluginName.value) {
        Notice('请选择一个插件', 'error')
    }

    const pluginInfo = pluginList.value[resetPluginName.value]
    if (!pluginInfo) {
        return
    }

    const pid = Number(resetPid.value)

    if (pid < 0 || !pidNameKV.value[pid.toString()]) {
        Notice('账号不存在', 'error')
        return
    }

    Request(store.basePath + '/passport/plugin/' + resetPluginName.value + '/reset/' + pid, {
        headers: {
            Authorization: store.authorization
        },
        method: 'POST'
    })
        .then((res) => {
            if (res.code !== 200) {
                Notice(res.message, 'error')
                //console.log(res)
                return
            }

            if (pid > 0) {
                Notice('已为 ' + pidNameKV.value[pid] + ' 重置插件 ' + pluginInfo.plugin_name_cn, 'success')
            } else {
                Notice('已重置插件 ' + pluginInfo.plugin_name_cn, 'success')
            }
            //console.log(res)
        })
        .finally(() => {
            resetPid.value = 0
        })
}

const dragStatus = ref<boolean>(false)

const dragEvent = (e: Event) => {
    e.preventDefault()
    switch (e.type) {
        case 'dragenter':
            dragStatus.value = true
            break
        case 'dragleave':
            //case 'dragend':
            dragStatus.value = false
            break
    }
}

const dropEvent = async (e: DragEvent) => {
    e.preventDefault()
    dragStatus.value = false
    for (const file of e.dataTransfer?.files || []) {
        let text = ''
        if (file.name.endsWith('.json')) {
            text = await file.text()
        } else {
            Notice('请选择正确的 json 备份文件', 'error')
            return
        }

        try {
            const data = JSON.parse(text)
            for (const table in data) {
                if (table.startsWith('tc_')) {
                    backupFileData.value[table] = data[table]
                }
            }
        } catch (err) {
            Notice('请选择正确的 json 备份文件', 'error')
            console.error('JSON parse error:', err)
        }

        return
    }
}
</script>
