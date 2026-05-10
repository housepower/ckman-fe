<template>
    <el-form ref="backupForm" :model="form" :rules="rules" label-width="130px" label-position="right">

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
                            <li>{{ $t('backup.Every hour') }}: <code>0 * * * *</code></li>
                            <li>{{ $t('backup.Daily at 0 AM') }}: <code>0 0 * * *</code></li>
                            <li>{{ $t('backup.Every Monday at 0 AM') }}: <code>0 0 * * 1</code></li>
                            <li>{{ $t('backup.First day of each month at 0 AM') }}: <code>0 0 1 * *</code></li>
                        </ul>
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
                        >
                            <div class="ms-row-option">
                                <span class="ms-option-name">{{ tbl.name }}</span>
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
                    <el-radio label="partition">{{ $t('backup.By Partition Name') }}</el-radio>
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
                v-if="form.backupStyle === 'incremental' && form.backupType === 'partition'"
                :label="$t('backup.Partition Name')"
                prop="partitions"
            >
                <el-select
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

            <!-- 按时间段 -->
            <el-form-item
                v-if="form.backupStyle === 'incremental' && form.backupType === 'daily'"
                :label="$t('backup.Time Range')"
                prop="daysBefore"
            >
                <el-select v-model="form.daysBefore" :placeholder="$t('backup.Select days')" style="width: 150px;">
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
                    <el-option label="AWS S3" value="s3" />
                </el-select>
            </el-form-item>

            <template v-if="form.target === 'local'">
                <el-form-item :label="$t('backup.Backup Path')" prop="localPath">
                    <el-input v-model="form.localPath" :placeholder="$t('backup.Enter backup path')" class="form-input" />
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
                    <el-option label="brotli" value="brotli" />
                    <el-option label="br" value="br" />
                    <el-option label="xz" value="xz" />
                    <el-option label="LZMA" value="LZMA" />
                    <el-option label="zstd" value="zstd" />
                    <el-option label="none" value="none" />
                </el-select>
            </el-form-item>

            <el-form-item :label="$t('backup.Clean Successful Partitions')" prop="clean">
                <el-switch v-model="form.clean" />
            </el-form-item>

            <el-form-item :label="$t('backup.Checksum')" prop="checksum">
                <el-switch v-model="form.checksum" />
            </el-form-item>
        </div>

        <!-- 操作按钮 -->
        <el-form-item>
            <el-button
                type="primary"
                @click="onSubmit"
                :loading="submitLoading"
                :disabled="form.scheduleType === 'scheduled' && form.backupStyle === 'full'"
            >
                {{ $t('backup.Start Backup') }}
            </el-button>
            <el-button @click="resetForm">{{ $t('common.Reset') }}</el-button>
        </el-form-item>
    </el-form>
</template>

<script>
import { DataManageApi, ConfigApi } from '@/apis';

export default {
    name: 'BackupComponent',
    created() {
        this.fetchInstanceList();
    },
    data() {
        return {
            cronHelpVisible: false,
            instanceList: [],
            submitLoading: false,
            // Table summary state
            tableList: [],          // [{name, partition_format, daily_compatible, total_bytes}]
            tablesLoading: false,
            tablesFallback: false,  // true = API failed, allow-create mode
            form: {
                scheduleType: 'immediate',
                crontab: '',
                instance: '',
                database: '',
                tables: [],          // string[] — directly submitted
                target: 's3',
                localPath: '',
                s3Endpoint: '',
                s3AccessKeyId: '',
                s3SecretAccessKey: '',
                s3Region: '',
                s3Bucket: '',
                compression: 'gzip',
                backupType: 'partition',
                daysBefore: 7,
                partitions: [],
                backupStyle: 'full',
                clean: false,
                checksum: true
            },
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
                            if (this.form.scheduleType === 'scheduled' && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Please enter cron expression')));
                            } else {
                                callback();
                            }
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
                localPath: [
                    {
                        required: false,
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 'local' && (!value || !value.trim())) {
                                callback(new Error(this.$t('backup.Please enter backup path')));
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
        // Total bytes of selected tables
        selectedTotalBytes() {
            if (this.tablesFallback || this.tableList.length === 0) return 0;
            return this.form.tables.reduce((sum, name) => {
                const tbl = this.tableList.find(t => t.name === name);
                return sum + (tbl ? (tbl.total_bytes || 0) : 0);
            }, 0);
        }
    },
    methods: {
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
            this.fetchTableSummary(this.$route.params.id, val);
        },

        handleTablesChange(val) {
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
            this.form.localPath = '';
            this.form.s3Endpoint = '';
            this.form.s3AccessKeyId = '';
            this.form.s3SecretAccessKey = '';
            this.form.s3Region = '';
            this.form.s3Bucket = '';
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
                days_before: this.form.daysBefore,
                target: this.form.target,
                compression: this.form.compression,
                clean: this.form.clean,
                checksum: this.form.checksum,
            };

            if (this.form.scheduleType === 'scheduled') {
                params.crontab = this.form.crontab;
                params.instance = this.form.instance;
            }

            if (this.form.backupStyle === 'incremental' && this.form.backupType === 'partition') {
                params.partitions = this.form.partitions;
            }

            if (this.form.target === 'local') {
                params.local = { path: this.form.localPath };
            } else if (this.form.target === 's3') {
                params.s3 = {
                    endpoint: this.form.s3Endpoint,
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
            this.$refs.backupForm.validate(async (valid) => {
                if (!valid) {
                    this.$message.error(this.$t('backup.Please check form'));
                    return false;
                }
                const params = this.buildBackupParams();
                if (!params) return;

                try {
                    this.submitLoading = true;
                    const { data } = await DataManageApi.backupData(this.$route.params.id, params);
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
                        // Do NOT navigate away — stay on form per spec
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

        // ── Reset ────────────────────────────────────────────────
        resetForm() {
            this.$refs.backupForm.resetFields();
            this.cronHelpVisible = false;
            this.form.tables = [];
            this.form.partitions = [];
            this.$message.info(this.$t('backup.Form Reset'));
        }
    }
};
</script>

<style scoped lang="scss">
@import '@/app/variables.scss';

.form-section {
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 16px;
    margin-bottom: 18px;

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

.warn-text {
    color: #ad6c00;
}
</style>
