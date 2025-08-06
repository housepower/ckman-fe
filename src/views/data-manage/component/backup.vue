<template>
    <el-form ref="backupForm" :model="form" :rules="rules" label-width="120px" label-position="right">
        <!-- 备份类型 -->
        <el-form-item :label="$t('backup.Backup Type')" prop="scheduleType">
            <el-radio-group v-model="form.scheduleType" @change="handleBackupTypeChange">
                <el-radio-button label="immediate">{{ $t('backup.Immediate Backup') }}</el-radio-button>
                <el-radio-button label="scheduled">{{ $t('backup.Scheduled Backup') }}</el-radio-button>
            </el-radio-group>
        </el-form-item>

        <!-- 定时备份设置 -->
        <el-form-item v-if="form.scheduleType === 'scheduled'" :label="$t('backup.Backup Interval')" prop="crontab">
            <el-input v-model="form.crontab" :placeholder="$t('backup.Enter cron expression')" class="form-input">
                <template #append>
                    <el-button @click="showCronHelp">{{ $t('common.Help') }}</el-button>
                </template>
            </el-input>
            <div v-if="cronHelpVisible" class="cron-help">
                <p>{{ $t('backup.Common cron expressions') }}：</p>
                <ul>
                    <li>{{ $t('backup.Every minute') }}: <code>0 * * * * ?</code></li>
                    <li>{{ $t('backup.Every hour') }}: <code>0 0 * * * ?</code></li>
                    <li>{{ $t('backup.Daily at 0 AM') }}: <code>0 0 0 * * ?</code></li>
                    <li>{{ $t('backup.Every Monday at 0 AM') }}: <code>0 0 0 * * 1</code></li>
                    <li>{{ $t('backup.First day of each month at 0 AM') }}: <code>0 0 0 1 * *</code></li>
                </ul>
            </div>
        </el-form-item>

        <!-- 数据库和表名 -->
        <el-form-item :label="$t('backup.Database')" prop="database">
            <el-input v-model="form.database" :placeholder="$t('backup.Enter database name')" class="form-input"></el-input>
        </el-form-item>

        <!-- 修改表名输入为列表形式 -->
        <el-form-item :label="$t('backup.Table Name')" prop="tables">
            <ul class="table-list-box">
                <li class="table-list-item" v-for="tableData of form.tables" :key="tableData.index">
                    <el-input v-model="tableData.value" :placeholder="$t('backup.Enter table name')" class="form-input" />
                    <div class="table-list-icon">
                        <i class="el-icon-circle-plus-outline fc-primary pointer" @click="addTable"></i>
                        <i class="el-icon-remove-outline fc-red pointer" v-show="form.tables.length >= 2"
                            @click="delTable(tableData.index)"></i>
                    </div>
                </li>
            </ul>
        </el-form-item>

        <!-- 备份方式 -->
        <el-form-item :label="$t('backup.Backup Method')" prop="backupStyle">
            <el-radio-group v-model="form.backupStyle" @change="handleBackupTypeChange">
                <el-radio label="full" :disabled="form.scheduleType === 'scheduled'">{{ $t('backup.Full Backup') }}</el-radio>
                <el-radio label="incremental">{{ $t('backup.Incremental Backup') }}</el-radio>
            </el-radio-group>
        </el-form-item>

        <!-- 在备份方式选项下方添加 -->
        <el-form-item v-if="form.backupStyle === 'incremental'" :label="$t('backup.Incremental Method')" prop="backupType">
            <el-radio-group v-model="form.backupType" @change="handleBackupStyleChange">
                <el-radio label="partition">{{ $t('backup.By Partition Name') }}</el-radio>
                <el-radio label="daily">{{ $t('backup.By Time Period') }}</el-radio>
            </el-radio-group>
        </el-form-item>

        <!-- 按分区名输入框 -->
        <el-form-item v-if="form.backupStyle === 'incremental' && form.backupType === 'partition'" :label="$t('backup.Partition Name')"
            prop="partitions">
            <el-select v-model="form.partitions" multiple filterable allow-create default-first-option
                :placeholder="$t('backup.Enter partition names')" class="form-input"
                @keyup.enter.native="handlePartitionInput">
                <el-option v-for="item in partitionOptions" :key="item" :label="item" :value="item">
                </el-option>
            </el-select>
        </el-form-item>

        <!-- 按时间段选择 -->
        <el-form-item v-if="form.backupStyle === 'incremental' && form.backupType === 'daily'" :label="$t('backup.Time Range')"
            prop="daysBefore">
            <el-select v-model="form.daysBefore" :placeholder="$t('backup.Select days')" style="width: 150px;">
                <el-option v-for="day in [1, 3, 7, 14, 30]" :key="day" :label="$t('backup.Days Ago', { day })" :value="day"></el-option>
            </el-select>
            <span style="margin-left:10px">{{ $t('backup.Or enter directly') }}:
                <el-input-number v-model="form.daysBefore" :min="1" :max="365" controls-position="right"
                    style="width:120px" />
                {{ $t('backup.Days Ago Text') }}
            </span>
        </el-form-item>

        <!-- 备份目标 -->
        <el-form-item :label="$t('backup.Backup Target')" prop="target">
            <el-select v-model="form.target" :placeholder="$t('backup.Select backup target')" @change="handleTargetChange" class="form-input">
                <!-- <el-option label="Local" value="local"></el-option> -->
                <el-option label="AWS S3" value="s3"></el-option>
            </el-select>
        </el-form-item>

        <!-- Local 配置 -->
        <template v-if="form.target === 'local'">
            <el-form-item :label="$t('backup.Backup Path')" prop="localPath">
                <el-input v-model="form.localPath" :placeholder="$t('backup.Enter backup path')"
                    class="form-input"></el-input>
            </el-form-item>
        </template>

        <!-- AWS S3 配置 -->
        <template v-if="form.target === 's3'">
            <el-form-item :label="$t('backup.Endpoint')" prop="s3Endpoint">
                <el-input v-model="form.s3Endpoint" :placeholder="$t('backup.Enter S3 endpoint')" class="form-input"></el-input>
            </el-form-item>

            <el-form-item :label="$t('backup.AccessKeyID')" prop="s3AccessKeyId">
                <el-input v-model="form.s3AccessKeyId" :placeholder="$t('backup.Enter AccessKeyID')" class="form-input"></el-input>
            </el-form-item>

            <el-form-item :label="$t('backup.SecretAccessKey')" prop="s3SecretAccessKey">
                <el-input v-model="form.s3SecretAccessKey" type="password" :placeholder="$t('backup.Enter SecretAccessKey')"
                    show-password class="form-input"></el-input>
            </el-form-item>

            <el-form-item :label="$t('backup.Region')" prop="s3Region">
                <el-input v-model="form.s3Region" :placeholder="$t('backup.Enter Region')" class="form-input"></el-input>
            </el-form-item>

            <el-form-item :label="$t('backup.Bucket')" prop="s3Bucket">
                <el-input v-model="form.s3Bucket" :placeholder="$t('backup.Enter Bucket name')" class="form-input"></el-input>
            </el-form-item>
        </template>

        <el-form-item :label="$t('backup.Compression Format')" prop="compression">
            <el-select v-model="form.compression" :placeholder="$t('backup.Select compression format')" class="form-input">
                <el-option label="gzip" value="gzip"></el-option>
                <el-option label="gz" value="gz"></el-option>
                <el-option label="brotli" value="brotli"></el-option>
                <el-option label="br" value="br"></el-option>
                <el-option label="xz" value="xz"></el-option>
                <el-option label="LZMA" value="LZMA"></el-option>
                <el-option label="zstd" value="zstd"></el-option>
                <el-option label="none" value="none"></el-option>
            </el-select>
        </el-form-item>

        <!-- 是否清理成功分区 -->
        <el-form-item :label="$t('backup.Clean Successful Partitions')" prop="clean">
            <el-switch v-model="form.clean"></el-switch>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
            <el-button type="primary" @click="onSubmit" :loading="submitLoading" :disabled="
                (form.scheduleType === 'scheduled' && form.backupStyle === 'full')">{{ $t('backup.Start Backup') }}</el-button>
            <el-button @click="resetForm">{{ $t('common.Reset') }}</el-button>
        </el-form-item>
    </el-form>
</template>

<script>

import { DataManageApi } from '@/apis'; // 引入API模块

export default {
    name: 'BackupComponent',
    data() {
        return {
            cronHelpVisible: false,
            partitionOptions: [],
            submitLoading: false, // 添加提交加载状态
            form: {
                scheduleType: 'immediate', // immediate 或 scheduled
                crontab: '',
                database: '',
                tables: [{ index: 1, value: '' }], // 表名数组，按照系统中已有的模式
                target: 's3', // local, s3
                // Local 配置
                localPath: '',
                // S3 配置
                s3Endpoint: '',
                s3AccessKeyId: '',
                s3SecretAccessKey: '',
                s3Region: '',
                s3Bucket: '',
                // 压缩格式
                compression: 'gzip',
                backupType: 'partition', // 备份类型：按分区名(partition)/按时间段(daily)
                daysBefore: 7,          // 按时间段备份的天数
                partitions: [],         // 按分区名备份的分区名称
                backupStyle: 'full',    // 备份方式：全量备份(full)/增量备份(incremental)
                clean: false            // 是否清理成功分区
            },
            rules: {
                scheduleType: [
                    { required: true, message: '请选择备份类型', trigger: 'change' }
                ],
                tables: [ // 修改验证规则
                    {
                        required: true,
                        message: '请输入至少一个表名',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (!this.form.tables ||
                                this.form.tables.length === 0 ||
                                this.form.tables.every(t => !t.value || t.value.trim() === '')) {
                                callback(new Error('请输入至少一个表名'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                partitions: [ // 注意：这里保持prop名称不变
                    {
                        required: true,
                        message: '请输入至少一个分区名称',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.backupType === 'partition' &&
                                this.form.partitions.length === 0) {
                                callback(new Error('请输入至少一个分区名称'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                crontab: [
                    {
                        required: true,
                        message: '请输入cron表达式',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.scheduleType === 'scheduled' && !value.trim()) {
                                callback(new Error('请输入cron表达式'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                database: [
                    { required: true, message: '请输入数据库名', trigger: 'blur' }
                ],
                target: [
                    { required: true, message: '请选择备份目标', trigger: 'change' }
                ],
                localPath: [
                    {
                        required: true,
                        message: '请输入备份路径',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 'local' && !value.trim()) {
                                callback(new Error('请输入备份路径'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3Endpoint: [
                    {
                        required: true,
                        message: '请输入S3端点地址',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && !value.trim()) {
                                callback(new Error('请输入S3端点地址'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3AccessKeyId: [
                    {
                        required: true,
                        message: '请输入AccessKeyID',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && !value.trim()) {
                                callback(new Error('请输入AccessKeyID'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3SecretAccessKey: [
                    {
                        required: true,
                        message: '请输入SecretAccessKey',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && !value.trim()) {
                                callback(new Error('请输入SecretAccessKey'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                s3Bucket: [
                    {
                        required: true,
                        message: '请输入Bucket名称',
                        trigger: 'blur',
                        validator: (rule, value, callback) => {
                            if (this.form.target === 's3' && !value.trim()) {
                                callback(new Error('请输入Bucket名称'));
                            } else {
                                callback();
                            }
                        }
                    }
                ],
                compression: [
                    { required: true, message: '请选择压缩格式', trigger: 'change' }
                ]
            }
        };
    },
    methods: {
        // 添加表名输入框
        addTable() {
            const newIndex = this.form.tables.length > 0
                ? Math.max(...this.form.tables.map(item => item.index)) + 1
                : 1;
            this.form.tables.push({ index: newIndex, value: '' });
        },

        // 删除表名输入框
        delTable(index) {
            if (this.form.tables.length > 1) {
                const idx = this.form.tables.findIndex(item => item.index === index);
                if (idx !== -1) {
                    this.form.tables.splice(idx, 1);
                }
            } else {
                this.form.tables[0].value = '';
            }
        },

        // 处理备份类型变化
        handleBackupTypeChange(value) {
            if (value === 'immediate') {
                this.form.crontab = '';
            } else if (value === 'scheduled') {
                // 定时备份只支持增量备份
                this.form.backupStyle = 'incremental';
            }
        },
        handleBackupStyleChange(value){
            if (value === 'partition') {
                this.form.daysBefore = 0;
            } else {
                this.form.partitions = [];
            }
        },
        handlePartitionInput(event) {
            const inputValue = event.target.value.trim();
            if (inputValue) {
                // 添加新分区到数组
                this.form.partitions.push(inputValue);
                // 添加到选项列表
                if (!this.partitionOptions.includes(inputValue)) {
                    this.partitionOptions.push(inputValue);
                }
                // 清空输入框
                event.target.value = '';
            }
        },

        // 处理目标类型变化
        handleTargetChange(value) {
            // 重置所有目标相关字段
            this.form.localPath = '';
            this.form.s3Endpoint = '';
            this.form.s3AccessKeyId = '';
            this.form.s3SecretAccessKey = '';
            this.form.s3Region = '';
            this.form.s3Bucket = '';

            this.form.daysBefore = typeof this.form.daysBefore === 'number'
                ? this.form.daysBefore : 7;
        },

        // 显示cron帮助
        showCronHelp() {
            this.cronHelpVisible = !this.cronHelpVisible;
        },

        // 构建备份参数
        buildBackupParams() {
            // 过滤掉空的表名
            const validTableNames = this.form.tables
                .filter(table => table.value && table.value.trim() !== '')
                .map(table => table.value);

            const params = {
                schedule_type: this.form.scheduleType,
                database: this.form.database,
                tables: validTableNames,
                backup_style: this.form.backupStyle,
                backup_type: this.form.backupType,
                days_before: this.form.daysBefore,
                target: this.form.target,
                Compression: this.form.compression,
                clean: this.form.clean
            };

            if (this.form.scheduleType === 'scheduled') {
                params.crontab = this.form.crontab;
            }

            if (this.form.backupStyle === 'incremental' && this.form.backupType === 'partition') {
                params.partitions = this.form.partitions;
            }

            if (this.form.scheduleType === 'scheduled' && this.form.backupStyle === 'full') {
                this.$message.error('定时备份不支持全量备份');
                return null;
            }

            if (this.form.target === 'local') {
                params.local = {
                    path: this.form.localPath
                };
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

        // 开始备份按钮点击事件
        onSubmit() {
            this.$refs.backupForm.validate(async (valid) => {
                if (valid) {
                    const params = this.buildBackupParams();
                    if (!params) return;

                    try {
                        this.submitLoading = true;
                        console.log('备份参数:', params);
                        const { data } = await DataManageApi.backupData(this.$route.params.id, params);
                        console.log('备份结果:', data);
                        // 根据retCode判断业务是否成功
                        if (data.retCode === '0000') {
                            this.$message.success(data.retMsg || '备份成功');
                            console.log('备份成功:', data);
                            
                        } else {
                            this.$message.error(data.retMsg || '备份失败');
                            console.error('备份失败:', data);
                        }
                    } catch (error) {
                        let errorMsg = '未知错误';
                        if (error.response && error.response.data) {
                            const responseData = error.response.data;
                            if (responseData.retMsg) {
                                errorMsg = responseData.retMsg;
                            } else if (responseData.message) {
                                errorMsg = responseData.message;
                            } else {
                                errorMsg = JSON.stringify(responseData);
                            }
                        } else if (error.message) {
                            errorMsg = error.message;
                        }
                        this.$message.error(errorMsg);
                    } finally {
                        this.submitLoading = false;
                    }
                } else {
                    this.$message.error('请检查表单填写是否正确');
                    return false;
                }
            });
        },

        // 重置表单
        resetForm() {
            this.$refs.backupForm.resetFields();
            this.cronHelpVisible = false;
            // 重置表名列表
            this.form.tables = [{ index: 1, value: '' }];
            this.$message.info('表单已重置');
        }
    }
};
</script>

<style scoped>
.backup-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-form-item {
    margin-bottom: 22px;
}

.cron-help {
    margin-top: 10px;
    padding: 10px;
    background-color: #f8f8f8;
    border-radius: 4px;
    border: 1px solid #ebeef5;
}

.cron-help ul {
    padding-left: 20px;
    margin: 10px 0;
}

.cron-help code {
    background-color: #f5f7fa;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: monospace;
}

.table-list-box {
    list-style: none;
    padding: 0;
    margin: 0;
}

.table-list-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.table-list-item .el-input {
    margin-right: 10px;
}

.table-list-icon {
    display: flex;
    align-items: center;
}

.fc-primary {
    color: #409EFF;
}

.fc-red {
    color: #F56C6C;
}

.pointer {
    cursor: pointer;
    font-size: 18px;
    margin: 0 5px;
}

/* 表单输入框样式 */
.form-input {
    width: 500px !important;
}

.help-text {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
}
</style>