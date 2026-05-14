<template>
    <el-dialog
        :visible="value"
        :title="$t('backup.New Backup Title')"
        width="760px"
        top="6vh"
        custom-class="backup-form-dialog"
        :close-on-click-modal="false"
        @update:visible="$emit('input', $event)"
        @opened="onOpened"
        @closed="onClosed"
    >
        <el-form ref="form" :model="form" :rules="rules" label-width="130px" label-position="right" size="small" class="scrollable-form">

            <!-- ① 调度 -->
            <div class="form-section">
                <div class="form-section-title"><span class="section-num">1</span>{{ $t('backup.Schedule') }}</div>

                <el-form-item :label="$t('backup.Backup Type')" prop="scheduleType">
                    <el-radio-group v-model="form.scheduleType" @change="handleBackupTypeChange">
                        <el-radio-button label="immediate">{{ $t('backup.Immediate Backup') }}</el-radio-button>
                        <el-radio-button label="scheduled">{{ $t('backup.Scheduled Backup') }}</el-radio-button>
                    </el-radio-group>
                </el-form-item>

                <template v-if="form.scheduleType === 'scheduled'">
                    <el-form-item :label="$t('backup.Backup Interval')" prop="crontab">
                        <el-input
                            v-model="form.crontab"
                            :placeholder="$t('backup.Enter cron expression')"
                            class="form-input"
                        >
                            <template #append>
                                <el-button @click="showCronHelp">{{ $t('common.Help') }}</el-button>
                            </template>
                        </el-input>
                        <div v-if="cronHelpVisible" class="cron-help">
                            <p>{{ $t('backup.Common cron expressions') }}：</p>
                            <ul>
                                <li>{{ $t('backup.Every hour') }}: <code>0 0 * * * *</code></li>
                                <li>{{ $t('backup.Daily at 0 AM') }}: <code>0 0 0 * * *</code></li>
                                <li>{{ $t('backup.Every Monday at 0 AM') }}: <code>0 0 0 * * 1</code></li>
                                <li>{{ $t('backup.First day of each month at 0 AM') }}: <code>0 0 0 1 * *</code></li>
                            </ul>
                        </div>
                        <div v-if="cronPreview.runs.length" class="cron-preview">
                            <span class="cron-preview-label">{{ $t('backup.Next Runs Preview') }}：</span>
                            <span v-for="(t, i) in cronPreview.runs" :key="i" class="cron-preview-item">{{ t }}</span>
                        </div>
                        <div v-else-if="cronPreviewInvalid" class="cron-preview cron-preview-invalid">
                            {{ $t('backup.Cron Invalid Preview') }}
                        </div>
                    </el-form-item>

                    <el-form-item :label="$t('backup.Instance')" prop="instance">
                        <el-select
                            v-model="form.instance"
                            :placeholder="$t('backup.Instance')"
                            class="form-input"
                            filterable
                            clearable
                        >
                            <el-option
                                v-for="item in instanceList"
                                :key="item"
                                :label="item"
                                :value="item"
                            />
                        </el-select>
                    </el-form-item>
                </template>
            </div>

            <!-- ② 备份对象 -->
            <div class="form-section">
                <div class="form-section-title"><span class="section-num">2</span>{{ $t('backup.Backup Object') }}</div>

                <!-- task_name — optional, placed at top of section -->
                <el-form-item :label="$t('backup.Task Name')" prop="task_name">
                    <el-input
                        v-model="form.task_name"
                        :placeholder="$t('backup.Task Name Placeholder')"
                        class="form-input"
                    />
                </el-form-item>

                <el-form-item :label="$t('backup.Database')" prop="database">
                    <el-input
                        v-model="form.database"
                        :placeholder="$t('backup.Enter database name')"
                        class="form-input"
                        @change="handleDatabaseChange"
                    />
                </el-form-item>

                <el-form-item :label="$t('backup.Table Name')" prop="tables">
                    <el-select
                        v-model="form.tables"
                        multiple
                        filterable
                        :allow-create="tablesFallback"
                        default-first-option
                        :placeholder="$t('backup.Search tables')"
                        class="form-input"
                        :loading="tablesLoading"
                        @change="handleTablesChange"
                    >
                        <template v-if="!tablesFallback">
                            <el-option
                                v-for="tbl in tableList"
                                :key="tbl.name"
                                :label="tbl.name"
                                :value="tbl.name"
                                :disabled="!!conflictingTables[tbl.name]"
                            >
                                <div class="ms-row-option">
                                    <span class="ms-option-name">{{ tbl.name }}</span>
                                    <span v-if="conflictingTables[tbl.name]" class="conflict-tag">
                                        {{ $t('backup.Already Scheduled', { task: conflictingTables[tbl.name] }) }}
                                    </span>
                                    <span :class="['partition-tag', partitionTagClass(tbl.partition_format)]">
                                        {{ partitionTagLabel(tbl.partition_format) }}
                                    </span>
                                    <span class="ms-option-size">{{ formatBytes(tbl.total_bytes) }}</span>
                                </div>
                            </el-option>
                        </template>
                    </el-select>

                    <!-- 计数器 -->
                    <div v-if="form.tables.length > 0" class="selection-counter">
                        {{ $t('backup.Selected Count', { count: form.tables.length, max: 100 }) }}
                        <template v-if="!tablesFallback && selectedTotalBytes > 0">
                            · {{ $t('backup.Total Size', { size: formatBytes(selectedTotalBytes) }) }}
                        </template>
                    </div>

                    <!-- 不兼容警告 -->
                    <div v-if="incompatibleTables.length > 0" class="warn-hint">
                        ⚠ {{ $t('backup.Incompatible Tables Warning', { count: incompatibleTables.length }) }}
                        （{{ incompatibleTables.join('、') }}）
                    </div>

                    <!-- 降级提示 -->
                    <div v-if="tablesFallback" class="form-hint-text">
                        {{ $t('backup.Tables Fallback Hint') }}
                    </div>
                </el-form-item>
            </div>

            <!-- ③ 备份方式 -->
            <div class="form-section">
                <div class="form-section-title"><span class="section-num">3</span>{{ $t('backup.Backup Mode') }}</div>

                <el-form-item :label="$t('backup.Backup Method')" prop="backupStyle">
                    <el-radio-group v-model="form.backupStyle" @change="handleBackupStyleChange">
                        <el-radio label="full" :disabled="form.scheduleType === 'scheduled'">{{ $t('backup.Full Backup') }}</el-radio>
                        <el-radio label="incremental">{{ $t('backup.Incremental Backup') }}</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item v-if="form.backupStyle === 'incremental'" :label="$t('backup.Incremental Method')" prop="backupType">
                    <el-radio-group v-model="form.backupType" @change="handleIncrementalTypeChange">
                        <el-tooltip
                            :content="$t('backup.Partition Disabled For Scheduled')"
                            :disabled="form.scheduleType !== 'scheduled'"
                            placement="top"
                        >
                            <el-radio label="partition" :disabled="form.scheduleType === 'scheduled'">{{ $t('backup.By Partition Name') }}</el-radio>
                        </el-tooltip>
                        <el-tooltip
                            :content="dailyDisabledReason"
                            :disabled="!dailyDisabled"
                            placement="top"
                        >
                            <el-radio label="daily" :disabled="dailyDisabled">{{ $t('backup.By Time Period') }}</el-radio>
                        </el-tooltip>
                    </el-radio-group>
                    <div v-if="dailyDisabled" class="form-hint-text warn-text">
                        {{ $t('backup.Daily Incompatible Hint') }}
                    </div>
                </el-form-item>

                <!-- 按分区名输入 -->
                <el-form-item
                    key="partition-input"
                    v-if="form.backupStyle === 'incremental' && form.backupType === 'partition'"
                    :label="$t('backup.Partition Name')"
                    prop="partitions"
                >
                    <el-select
                        key="partition-select"
                        v-model="form.partitions"
                        multiple
                        filterable
                        allow-create
                        default-first-option
                        :placeholder="$t('backup.Enter partition names')"
                        class="form-input"
                    >
                    </el-select>
                    <div class="selection-counter">
                        {{ $t('backup.Partition Count', { count: form.partitions.length, max: 200 }) }}
                    </div>
                </el-form-item>

                <!-- 按时间段：模式切换（仅 immediate 出现 radio） -->
                <el-form-item
                    key="range-mode"
                    v-if="form.backupStyle === 'incremental' && form.backupType === 'daily' && form.scheduleType === 'immediate'"
                    :label="$t('backup.Range Mode')"
                >
                    <el-radio-group v-model="form.rangeMode">
                        <el-radio label="rolling">{{ $t('backup.Range Mode Rolling') }}</el-radio>
                        <el-radio label="fixed">{{ $t('backup.Range Mode Fixed') }}</el-radio>
                    </el-radio-group>
                    <div v-if="form.rangeMode === 'fixed'" class="start-date-hint">{{ $t('backup.Range Mode Fixed Hint') }}</div>
                </el-form-item>

                <!-- 滚动窗口模式 -->
                <el-form-item
                    key="daily-input"
                    v-if="form.backupStyle === 'incremental' && form.backupType === 'daily' && rangeModeEffective === 'rolling'"
                    :label="$t('backup.Time Range')"
                    prop="daysBefore"
                >
                    <el-select key="daily-select" v-model="form.daysBefore" :placeholder="$t('backup.Select days')" style="width: 150px;">
                        <el-option v-for="day in [1, 3, 7, 14, 30]" :key="day" :label="$t('backup.Days Ago', { day })" :value="day" />
                    </el-select>
                    <span style="margin-left:10px">{{ $t('backup.Or enter directly') }}:
                        <el-input-number
                            v-model="form.daysBefore"
                            :min="1"
                            :max="365"
                            controls-position="right"
                            style="width:120px"
                        />
                        {{ $t('backup.Days Ago Text') }}
                    </span>
                </el-form-item>

                <el-form-item
                    key="start-date-input"
                    v-if="form.backupStyle === 'incremental' && form.backupType === 'daily' && rangeModeEffective === 'rolling'"
                    :label="$t('backup.Start Date')"
                >
                    <el-date-picker
                        v-model="form.startDate"
                        type="date"
                        :placeholder="$t('backup.Start Date Optional')"
                        format="yyyy-MM-dd"
                        value-format="yyyyMMdd"
                        style="width: 200px;"
                    />
                    <div class="start-date-hint">{{ $t('backup.Start Date Hint') }}</div>
                    <div v-if="effectiveRangeText" class="effective-range" :class="{ 'effective-range-skip': effectiveRangeSkip }">
                        {{ $t('backup.Effective Range') }}: {{ effectiveRangeText }}
                    </div>
                </el-form-item>

                <!-- 固定区间模式 -->
                <el-form-item
                    key="fixed-range-input"
                    v-if="form.backupStyle === 'incremental' && form.backupType === 'daily' && rangeModeEffective === 'fixed'"
                    :label="$t('backup.Fixed Range')"
                    prop="fixedRange"
                >
                    <el-date-picker
                        v-model="form.fixedRange"
                        type="daterange"
                        :start-placeholder="$t('backup.Range Start Placeholder')"
                        :end-placeholder="$t('backup.Range End Placeholder')"
                        format="yyyy-MM-dd"
                        value-format="yyyyMMdd"
                        style="width: 320px;"
                    />
                    <div v-if="fixedRangeInvalid" class="effective-range effective-range-skip">
                        {{ $t('backup.Range Invalid') }}
                    </div>
                </el-form-item>
            </div>

            <!-- ④ 备份目标 -->
            <div class="form-section">
                <div class="form-section-title"><span class="section-num">4</span>{{ $t('backup.Backup Target Section') }}</div>

                <el-form-item :label="$t('backup.Backup Target')" prop="target">
                    <el-select
                        v-model="form.target"
                        :placeholder="$t('backup.Select backup target')"
                        @change="handleTargetChange"
                        class="form-input"
                    >
                        <el-option label="Local" value="local" />
                        <el-option label="AWS S3" value="s3" />
                    </el-select>
                </el-form-item>

                <template v-if="form.target === 'local'">
                    <el-form-item :label="$t('backup.Local Disk')" prop="localDisk">
                        <!-- 加载中占位 -->
                        <div v-if="disksLoading" class="disk-loading">
                            <i class="el-icon-loading" /> {{ $t('backup.Loading Disks') }}
                        </div>

                        <!-- 有 disk 列表 → dropdown -->
                        <template v-else-if="diskList.length > 0">
                            <el-select
                                v-model="form.localDisk"
                                :placeholder="$t('backup.Select Local Disk')"
                                class="form-input"
                                @change="onLocalDiskChange"
                            >
                                <el-option
                                    v-for="d in diskList"
                                    :key="d.name"
                                    :label="`${d.name} (${d.path})`"
                                    :value="d.name"
                                >
                                    <div class="disk-option-row">
                                        <span class="disk-name">{{ d.name }}</span>
                                        <span class="disk-path">{{ d.path }}</span>
                                        <span class="disk-tag">
                                            <el-tag v-if="d.allowed_backup" size="mini" type="success">allow_backup</el-tag>
                                            <el-tag v-else size="mini" type="warning">&#9888; {{ $t('backup.Disk Tag Unsafe') }}</el-tag>
                                        </span>
                                    </div>
                                </el-option>
                            </el-select>
                            <div v-if="selectedDiskUnsafe" class="warn-hint" style="margin-top:6px">
                                &#9888; {{ $t('backup.Disk Unsafe Hint', { name: form.localDisk }) }}
                            </div>
                        </template>

                        <!-- 空列表 fallback → 手动输入 -->
                        <template v-else>
                            <el-input
                                v-model="form.localPath"
                                :placeholder="$t('backup.Enter Backup Path')"
                                class="form-input"
                            />
                            <div class="warn-hint" style="margin-top:6px">
                                &#9888; {{ $t('backup.Disk Empty Hint') }}
                            </div>
                        </template>
                    </el-form-item>
                </template>

                <template v-if="form.target === 's3'">
                    <el-form-item :label="$t('backup.Endpoint')" prop="s3Endpoint">
                        <el-input v-model="form.s3Endpoint" :placeholder="$t('backup.Enter S3 endpoint')" class="form-input" />
                    </el-form-item>
                    <el-form-item :label="$t('backup.AccessKeyID')" prop="s3AccessKeyId">
                        <el-input v-model="form.s3AccessKeyId" :placeholder="$t('backup.Enter AccessKeyID')" class="form-input" />
                    </el-form-item>
                    <el-form-item :label="$t('backup.SecretAccessKey')" prop="s3SecretAccessKey">
                        <el-input
                            v-model="form.s3SecretAccessKey"
                            type="password"
                            :placeholder="$t('backup.Enter SecretAccessKey')"
                            show-password
                            class="form-input"
                        />
                    </el-form-item>
                    <el-form-item :label="$t('backup.Region')" prop="s3Region">
                        <el-input v-model="form.s3Region" :placeholder="$t('backup.Enter Region')" class="form-input" />
                    </el-form-item>
                    <el-form-item :label="$t('backup.Bucket')" prop="s3Bucket">
                        <el-input v-model="form.s3Bucket" :placeholder="$t('backup.Enter Bucket name')" class="form-input" />
                    </el-form-item>
                </template>
            </div>

            <!-- ⑤ 选项 -->
            <div class="form-section">
                <div class="form-section-title"><span class="section-num">5</span>{{ $t('backup.Options') }}</div>

                <el-form-item :label="$t('backup.Compression Format')" prop="compression">
                    <el-select v-model="form.compression" :placeholder="$t('backup.Select compression format')" class="form-input">
                        <el-option label="gzip" value="gzip" />
                        <el-option label="gz" value="gz" />
                        <el-option label="zstd" value="zstd" />
                        <el-option label="none" value="none" />
                    </el-select>
                </el-form-item>

                <el-form-item :label="$t('backup.Clean Successful Partitions')" prop="clean">
                    <el-switch v-model="form.clean" />
                </el-form-item>

                <el-form-item :label="$t('backup.Checksum')" prop="checksum">
                    <el-tooltip
                        :content="$t('backup.Checksum Disabled By Compression')"
                        :disabled="!checksumDisabled"
                        placement="top"
                    >
                        <el-switch v-model="form.checksum" :disabled="checksumDisabled" />
                    </el-tooltip>
                    <span v-if="checksumDisabled" class="checksum-hint">
                        {{ $t('backup.Checksum Disabled By Compression') }}
                    </span>
                </el-form-item>
            </div>

        </el-form>

        <span slot="footer">
            <el-button @click="$emit('input', false)">{{ $t('history.Cancel') }}</el-button>
            <el-button
                type="primary"
                :loading="submitLoading"
                :disabled="form.scheduleType === 'scheduled' && form.backupStyle === 'full'"
                @click="onSubmit"
            >
                {{ $t('backup.Submit Backup') }}
            </el-button>
        </span>
    </el-dialog>
</template>

<script>
import { DataManageApi, ConfigApi } from '@/apis';
import { parseCronNextRuns } from '@/helpers';

export default {
    name: 'BackupFormDialog',
    model: { prop: 'value', event: 'input' },
    props: {
        value: { type: Boolean, default: false },
        cluster: { type: String, required: true },
        // 已存在的 policies（来自父组件 history.vue），用于检测重复定时备份
        policies: { type: Array, default: () => [] },
    },
    data() {
        return {
            cronHelpVisible: false,
            cronPreview: { valid: false, runs: [] },
            cronPreviewTimer: null,
            instanceList: [],
            submitLoading: false,
            // Table summary state
            tableList: [],          // [{name, partition_format, daily_compatible, total_bytes}]
            tablesLoading: false,
            tablesFallback: false,  // true = API failed, allow-create mode
            // Local disk state
            diskList: [],           // [{name, type, path, allowed_backup}]
            disksLoading: false,
            form: this.emptyForm(),
            rules: {
                scheduleType: [
                    { required: true, message: this.$t('backup.Please select backup type'), trigger: 'change' }
                ],
                tables: [
                    {
                        required: true,
                        trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (!value || value.length === 0) {
                                callback(new Error(this.$t('backup.Please enter at least one table name')));
                            } else if (value.length > 100) {
                                callback(new Error(this.$t('backup.Max 100 Tables')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                partitions: [
                    {
                        required: false,
                        trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (this.form.backupStyle === 'incremental' && this.form.backupType === 'partition') {
                                if (!value || value.length === 0) {
                                    callback(new Error(this.$t('backup.Please enter at least one partition name')));
                                } else if (value.length > 200) {
                                    callback(new Error(this.$t('backup.Max 200 Partitions')));
                                } else {
                                    callback();
                                }
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                crontab: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.scheduleType !== 'scheduled') {
                                callback();
                                return;
                            }
                            if (!value || !value.trim()) {
                                callback(new Error(this.$t('backup.Please enter cron expression')));
                                return;
                            }
                            if (value.trim().split(/\s+/).length !== 6) {
                                callback(new Error(this.$t('backup.Invalid cron fields')));
                                return;
                            }
                            callback();
                        }
                    }
                ],
                fixedRange: [
                    {
                        required: false,
                        trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (this.rangeModeEffective !== 'fixed') { callback(); return; }
                            if (!Array.isArray(value) || value.length !== 2 || !value[0] || !value[1]) {
                                callback(new Error(this.$t('backup.Range Start Placeholder') + ' / ' + this.$t('backup.Range End Placeholder')));
                                return;
                            }
                            if (value[0] > value[1]) {
                                callback(new Error(this.$t('backup.Range Invalid')));
                                return;
                            }
                            callback();
                        }
                    }
                ],
                instance: [
                    {
                        required: false,
                        trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (this.form.scheduleType === 'scheduled' && !value) {
                                callback(new Error(this.$t('backup.Please select instance')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                database: [
                    { required: true, message: this.$t('backup.Please enter database name'), trigger: 'blur' }
                ],
                target: [
                    { required: true, message: this.$t('backup.Please select backup target'), trigger: 'change' }
                ],
                localDisk: [
                    {
                        required: false,
                        trigger: 'change',
                        validator: (rule, value, callback) => {
                            if (this.form.target !== 'local') { callback(); return; }
                            if (this.diskList.length > 0 && !value) {
                                callback(new Error(this.$t('backup.Select Local Disk')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                localPath: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target !== 'local') { callback(); return; }
                            if (this.diskList.length === 0 && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Enter Backup Path')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3Endpoint: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Please enter S3 endpoint')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3AccessKeyId: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Please enter AccessKeyID')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3SecretAccessKey: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Please enter SecretAccessKey')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3Bucket: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Please enter Bucket name')));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                compression: [
                    { required: true, message: this.$t('backup.Please select compression format'), trigger: 'change' }
                ]
            }
        };
    },
    computed: {
        // Tables that are not compatible with daily mode
        incompatibleTables() {
            if (this.tablesFallback || this.tableList.length === 0) return [];
            return this.form.tables.filter(name => {
                const tbl = this.tableList.find(t => t.name === name);
                return tbl && tbl.daily_compatible === false;
            });
        },
        // Whether "daily" radio should be disabled
        dailyDisabled() {
            return this.incompatibleTables.length > 0;
        },
        // Tooltip content for disabled daily radio
        dailyDisabledReason() {
            if (this.incompatibleTables.length === 0) return '';
            return this.$t('backup.Daily Disabled Reason', { tables: this.incompatibleTables.join(', ') });
        },
        // Whether selected local disk has allow_backup=false
        selectedDiskUnsafe() {
            if (!this.form.localDisk) return false;
            const d = this.diskList.find(x => x.name === this.form.localDisk);
            return d && !d.allowed_backup;
        },
        // Total bytes of selected tables
        selectedTotalBytes() {
            if (this.tablesFallback || this.tableList.length === 0) return 0;
            return this.form.tables.reduce((sum, name) => {
                const tbl = this.tableList.find(t => t.name === name);
                return sum + (tbl ? (tbl.total_bytes || 0) : 0);
            }, 0);
        },
        // 压缩开启时，checksum 的逐文件 md5 比对没意义（CK 上传的是 gzip 字节流，
        // 与本地 raw md5 必然不等），后端会跳过 md5 比对——前端直接禁用 + 提示。
        checksumDisabled() {
            const c = (this.form.compression || '').toLowerCase();
            return c !== '' && c !== 'none';
        },
        // 已挂在 active scheduled task 下的表（同 cluster + 当前 database）。
        // 仅在 scheduleType=scheduled 时影响选项可用性。
        conflictingTables() {
            const map = {};
            if (this.form.scheduleType !== 'scheduled' || !this.form.database) return map;
            for (const p of this.policies) {
                if (p.deleted || !p.enabled) continue;
                if (p.schedule_type !== 'scheduled') continue;
                if (p.cluster_name !== this.cluster) continue;
                if (p.database !== this.form.database) continue;
                map[p.table] = p.task_name || `${p.database}.${p.table}`;
            }
            return map;
        },
        cronPreviewInvalid() {
            if (this.form.scheduleType !== 'scheduled') return false;
            const v = (this.form.crontab || '').trim();
            return v.length > 0 && !this.cronPreview.valid;
        },
        windowEndDate() {
            const d = new Date();
            d.setDate(d.getDate() - (this.form.daysBefore || 0));
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        },
        startDateFormatted() {
            const s = this.form.startDate || '';
            if (s.length !== 8) return '';
            return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
        },
        effectiveRangeSkip() {
            if (!this.startDateFormatted) return false;
            return this.startDateFormatted > this.windowEndDate;
        },
        effectiveRangeText() {
            if (this.form.backupStyle !== 'incremental' || this.form.backupType !== 'daily') return '';
            const end = this.windowEndDate;
            if (!this.startDateFormatted) {
                return `${this.$t('backup.No Lower Bound')} ~ ${end}`;
            }
            if (this.effectiveRangeSkip) {
                return `${this.startDateFormatted} ~ ${end}（${this.$t('backup.Effective Range Skip')}）`;
            }
            return `${this.startDateFormatted} ~ ${end}`;
        },
        // scheduled 强制为 rolling，避免被后端拒绝
        rangeModeEffective() {
            if (this.form.scheduleType !== 'immediate') return 'rolling';
            return this.form.rangeMode || 'rolling';
        },
        fixedRangeInvalid() {
            if (this.rangeModeEffective !== 'fixed') return false;
            const r = this.form.fixedRange;
            if (!Array.isArray(r) || r.length !== 2 || !r[0] || !r[1]) return false;
            return r[0] > r[1];
        }
    },
    watch: {
        'form.crontab'() {
            this.schedulePreviewUpdate();
        },
        'form.scheduleType'(val) {
            if (val !== 'scheduled') {
                this.cronPreview = { valid: false, runs: [] };
            } else {
                this.schedulePreviewUpdate();
            }
        },
        'form.target'(val) {
            if (val === 'local') {
                this.fetchDisks();
            }
        },
        // 切到压缩格式时自动关 checksum
        'form.compression'(val) {
            const c = (val || '').toLowerCase();
            if (c !== '' && c !== 'none') {
                this.form.checksum = false;
            }
        },
        // 增量类型切换时清掉对方字段，避免视觉残留 + 提交脏数据
        'form.backupType'(newVal) {
            if (newVal === 'partition') {
                this.form.daysBefore = 7;
            } else if (newVal === 'daily') {
                this.form.partitions = [];
            }
        },
        // 全量备份不需要 partitions / daysBefore
        'form.backupStyle'(newVal) {
            if (newVal === 'full') {
                this.form.partitions = [];
                this.form.daysBefore = 7;
            }
        },
    },
    beforeDestroy() {
        if (this.cronPreviewTimer) clearTimeout(this.cronPreviewTimer);
    },
    methods: {
        schedulePreviewUpdate() {
            if (this.cronPreviewTimer) clearTimeout(this.cronPreviewTimer);
            this.cronPreviewTimer = setTimeout(() => {
                if (this.form.scheduleType !== 'scheduled') {
                    this.cronPreview = { valid: false, runs: [] };
                    return;
                }
                this.cronPreview = parseCronNextRuns(this.form.crontab, 3);
            }, 250);
        },
        // ── Dialog lifecycle ───────────────────────────────────────
        onOpened() {
            this.fetchInstanceList();
            // If database is already set (e.g. copied form), fetch tables too
            if (this.form.database && this.form.database.trim()) {
                this.fetchTableSummary(this.cluster, this.form.database);
            }
            // If target is already local, fetch disks
            if (this.form.target === 'local') {
                this.fetchDisks();
            }
        },

        onClosed() {
            this.form = this.emptyForm();
            this.tableList = [];
            this.diskList = [];
            this.tablesFallback = false;
            this.cronHelpVisible = false;
            this.cronPreview = { valid: false, runs: [] };
            if (this.cronPreviewTimer) { clearTimeout(this.cronPreviewTimer); this.cronPreviewTimer = null; }
            // Reset form validation state
            this.$nextTick(() => {
                if (this.$refs.form) {
                    this.$refs.form.clearValidate();
                }
            });
        },

        emptyForm() {
            return {
                task_name: '',
                scheduleType: 'immediate',
                crontab: '',
                instance: '',
                database: '',
                tables: [],          // string[] — directly submitted
                target: 's3',
                localDisk: '',       // selected disk name
                localPath: '',
                s3Endpoint: '',
                s3AccessKeyId: '',
                s3SecretAccessKey: '',
                s3Region: '',
                s3Bucket: '',
                compression: 'gzip',
                backupType: 'partition',
                daysBefore: 7,
                startDate: '',
                rangeMode: 'rolling',
                fixedRange: null,
                partitions: [],
                backupStyle: 'full',
                clean: false,
                checksum: true
            };
        },

        // ── Partition tag helpers ──────────────────────────────────
        partitionTagClass(format) {
            const map = { day: 'daily', month: 'month', hour: 'daily', custom: 'custom', none: 'none' };
            return map[format] || 'custom';
        },
        partitionTagLabel(format) {
            const map = {
                day: this.$t('backup.Partition Day'),
                month: this.$t('backup.Partition Month'),
                hour: this.$t('backup.Partition Hour'),
                custom: this.$t('backup.Partition Custom'),
                none: this.$t('backup.Partition None')
            };
            return map[format] || (format || this.$t('backup.Partition Unknown'));
        },

        // ── Byte formatter ─────────────────────────────────────────
        formatBytes(bytes) {
            if (!bytes || bytes === 0) return '—';
            const units = ['B', 'KB', 'MB', 'GB', 'TB'];
            let val = bytes;
            let ui = 0;
            while (val >= 1024 && ui < units.length - 1) { val /= 1024; ui++; }
            return val.toFixed(1) + ' ' + units[ui];
        },

        // ── Local disk list ────────────────────────────────────────
        async fetchDisks() {
            this.disksLoading = true;
            try {
                const res = await DataManageApi.getClusterDisks(this.cluster);
                if (res.data.retCode === '0000') {
                    this.diskList = res.data.entity || [];
                } else {
                    this.diskList = [];
                }
            } catch (e) {
                this.diskList = [];
            } finally {
                this.disksLoading = false;
            }
        },

        onLocalDiskChange(diskName) {
            const d = this.diskList.find(x => x.name === diskName);
            if (d) {
                this.form.localPath = d.path;
            }
        },

        // ── Instance list ──────────────────────────────────────────
        async fetchInstanceList() {
            try {
                const response = await ConfigApi.getInstances();
                if (response.data.retCode === '0000') {
                    this.instanceList = response.data.entity || [];
                } else {
                    this.$message.error(response.data.retMsg || this.$t('backup.Fetch Instance Failed'));
                }
            } catch (error) {
                console.error('fetchInstanceList error:', error);
            }
        },

        // ── Table summary ─────────────────────────────────────────
        async fetchTableSummary(cluster, database) {
            if (!cluster || !database || !database.trim()) {
                this.tableList = [];
                this.tablesFallback = false;
                return;
            }
            this.tablesLoading = true;
            try {
                const { data } = await DataManageApi.getTableSummary(cluster, database);
                if (data.retCode === '0000' && Array.isArray(data.entity) && data.entity.length > 0) {
                    this.tableList = data.entity;
                    this.tablesFallback = false;
                } else {
                    // API succeeded but empty — fall back to allow-create
                    this.tableList = [];
                    this.tablesFallback = true;
                }
            } catch (err) {
                // API not implemented or network error — graceful fallback
                console.warn('getTableSummary failed, falling back to free input:', err);
                this.tableList = [];
                this.tablesFallback = true;
            } finally {
                this.tablesLoading = false;
            }
        },

        // ── Event handlers ─────────────────────────────────────────
        handleDatabaseChange(val) {
            // Reset tables selection when database changes
            this.form.tables = [];
            this.fetchTableSummary(this.cluster, val);
        },

        handleTablesChange() {
            // If daily is selected but now becomes disabled, switch to partition
            if (this.dailyDisabled && this.form.backupType === 'daily') {
                this.form.backupType = 'partition';
            }
        },

        handleBackupTypeChange(value) {
            if (value === 'immediate') {
                this.form.crontab = '';
                this.form.instance = '';
            } else if (value === 'scheduled') {
                this.form.backupStyle = 'incremental';
                this.form.backupType = 'daily';
                this.form.partitions = [];
                // 切到定时备份时，把已选的冲突表清掉，避免提交时被后端拒绝
                this.form.tables = this.form.tables.filter(t => !this.conflictingTables[t]);
                // 固定区间仅 immediate 支持，切到 scheduled 时强制回滚动模式
                this.form.rangeMode = 'rolling';
                this.form.fixedRange = null;
            }
        },

        handleBackupStyleChange(value) {
            if (value === 'full') {
                this.form.daysBefore = 7;
                this.form.partitions = [];
            }
        },

        handleIncrementalTypeChange(value) {
            if (value === 'partition') {
                this.form.daysBefore = 7;
            } else {
                this.form.partitions = [];
            }
        },

        handleTargetChange() {
            this.form.localDisk = '';
            this.form.localPath = '';
            this.form.s3Endpoint = '';
            this.form.s3AccessKeyId = '';
            this.form.s3SecretAccessKey = '';
            this.form.s3Region = '';
            this.form.s3Bucket = '';
            this.diskList = [];
        },

        showCronHelp() {
            this.cronHelpVisible = !this.cronHelpVisible;
        },

        // ── Build params ──────────────────────────────────────────
        buildBackupParams() {
            if (this.form.scheduleType === 'scheduled' && this.form.backupStyle === 'full') {
                this.$message.error(this.$t('backup.Scheduled full backup not supported'));
                return null;
            }

            const params = {
                schedule_type: this.form.scheduleType,
                database: this.form.database,
                tables: this.form.tables,    // string[] — directly
                backup_style: this.form.backupStyle,
                backup_type: this.form.backupType,
                target: this.form.target,
                compression: this.form.compression,
                clean: this.form.clean,
                checksum: this.form.checksum,
            };

            // task_name: include only if non-empty (backend auto-generates when absent)
            if (this.form.task_name && this.form.task_name.trim()) {
                params.task_name = this.form.task_name.trim();
            }

            if (this.form.scheduleType === 'scheduled') {
                params.crontab = this.form.crontab;
                params.instance = this.form.instance;
            }

            if (this.form.backupStyle === 'incremental' && this.form.backupType === 'partition') {
                params.partitions = this.form.partitions;
            }

            if (this.form.backupStyle === 'incremental' && this.form.backupType === 'daily') {
                if (this.rangeModeEffective === 'fixed') {
                    const r = this.form.fixedRange || [];
                    params.range_start_date = r[0] || '';
                    params.range_end_date = r[1] || '';
                } else {
                    params.days_before = this.form.daysBefore;
                    params.start_date = this.form.startDate || '';
                }
            }

            if (this.form.target === 'local') {
                params.local = { path: this.form.localPath };
            } else if (this.form.target === 's3') {
                params.s3 = {
                    endpoint: (this.form.s3Endpoint || '').trim().replace(/\/+$/, ''),
                    accessKeyId: this.form.s3AccessKeyId,
                    secretAccessKey: this.form.s3SecretAccessKey,
                    region: this.form.s3Region,
                    bucket: this.form.s3Bucket
                };
            }

            return params;
        },

        // ── Submit ────────────────────────────────────────────────
        onSubmit() {
            this.$refs.form.validate(async (valid) => {
                if (!valid) {
                    this.$message.error(this.$t('backup.Please check form'));
                    return false;
                }
                const params = this.buildBackupParams();
                if (!params) return;

                try {
                    this.submitLoading = true;
                    const { data } = await DataManageApi.backupData(this.cluster, params);
                    if (data.retCode === '0000') {
                        const runIds = (data.entity && data.entity.run_ids) ? data.entity.run_ids : [];
                        if (runIds.length > 0) {
                            this.$message.success(
                                this.$t('backup.Submitted Tasks', { n: runIds.length })
                            );
                        } else {
                            // Scheduled backup — policy created, no run_ids
                            this.$message.success(data.retMsg || this.$t('backup.Backup Success'));
                        }
                        this.$emit('submitted', runIds);
                        this.$emit('input', false);
                    } else {
                        this.$message.error(data.retMsg || this.$t('backup.Backup Failed'));
                    }
                } catch (error) {
                    let errorMsg = this.$t('backup.Unknown Error');
                    if (error.response && error.response.data) {
                        const rd = error.response.data;
                        errorMsg = rd.retMsg || rd.message || JSON.stringify(rd);
                    } else if (error.message) {
                        errorMsg = error.message;
                    }
                    this.$message.error(errorMsg);
                } finally {
                    this.submitLoading = false;
                }
            });
        },
    }
};
</script>

<style scoped lang="scss">
@import '@/app/variables.scss';

.scrollable-form {
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    padding-right: 6px;
}

.form-section {
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 12px;
    margin-bottom: 12px;

    &:last-of-type {
        border-bottom: none;
    }
}

.form-section-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin: 0 0 14px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.section-num {
    background: $primary-color;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    flex-shrink: 0;
}

/* form-input: 500px wide inputs */
.form-input {
    width: 500px !important;
}

/* cron help block */
.cron-help {
    margin-top: 8px;
    padding: 10px 14px;
    background-color: #f8f8f8;
    border-radius: 4px;
    border: 1px solid #ebeef5;
    font-size: 13px;

    ul {
        padding-left: 20px;
        margin: 6px 0 0;
    }

    code {
        background-color: #f5f7fa;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: monospace;
    }
}

/* cron preview block: real-time next-run times */
.cron-preview {
    margin-top: 6px;
    font-size: 12px;
    color: #67c23a;
    line-height: 1.6;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
}
.cron-preview-label {
    color: #606266;
}
.cron-preview-item {
    font-family: monospace;
    background: #f0f9eb;
    padding: 1px 6px;
    border-radius: 3px;
}
.cron-preview-invalid {
    color: #909399;
}

/* table option row in dropdown */
.ms-row-option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.ms-option-name {
    flex: 1;
    color: #303133;
    font-size: 13px;
}

.ms-option-size {
    font-size: 11px;
    color: #909399;
    min-width: 60px;
    text-align: right;
}

/* conflict tag for already-scheduled tables */
.conflict-tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 2px;
    background: #fef0f0;
    color: #F56C6C;
    border: 1px solid #fbc4c4;
    white-space: nowrap;
}

/* partition-tag variants */
.partition-tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 2px;
    text-align: center;
    white-space: nowrap;

    &.daily {
        background: #f0f9eb;
        color: #67C23A;
        border: 1px solid #c2e7b0;
    }

    &.month {
        background: #fdf6ec;
        color: #E6A23C;
        border: 1px solid #f5dab1;
    }

    &.none {
        background: #fef0f0;
        color: #F56C6C;
        border: 1px solid #fbc4c4;
    }

    &.custom {
        background: #f4f4f5;
        color: #909399;
        border: 1px solid #e9e9eb;
    }
}

/* selection counter */
.selection-counter {
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
}

/* warn hint (yellow background) */
.warn-hint {
    margin-top: 6px;
    padding: 8px 10px;
    background: #fdf6ec;
    border: 1px solid #f5dab1;
    color: #ad6c00;
    border-radius: 3px;
    font-size: 12px;
    line-height: 1.5;

    code {
        background: white;
        padding: 0 3px;
        border-radius: 2px;
    }
}

/* generic hint text */
.form-hint-text {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
}

/* start-date hint + effective range preview */
.start-date-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
}
.effective-range {
    margin-top: 4px;
    font-size: 12px;
    color: #67c23a;
    line-height: 1.5;
}
.effective-range-skip {
    color: #e6a23c;
}

/* compression-disabled-checksum hint: very muted, do not distract */
.checksum-hint {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    line-height: 1.4;
    color: #c0c4cc;
}

.warn-text {
    color: #ad6c00;
}

.disk-loading {
    color: #909399;
    font-size: 13px;
    padding: 6px 0;

    .el-icon-loading {
        margin-right: 4px;
        color: #C9A100;
    }
}

.disk-option-row {
    display: grid;
    grid-template-columns: 120px 1fr auto;
    gap: 12px;
    align-items: center;

    .disk-name {
        font-weight: 500;
        color: #303133;
    }

    .disk-path {
        font-size: 12px;
        color: #909399;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .disk-tag {
        text-align: right;
    }
}
</style>

<style>
.backup-form-dialog .el-dialog__body { padding: 14px 20px; }
.backup-form-dialog .el-dialog__header { padding: 14px 20px 10px; }
.backup-form-dialog .el-dialog__footer { padding: 8px 20px 14px; }
</style>
