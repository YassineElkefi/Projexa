import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * SUB_TASK → TASK, then root-level TASK → TICKET (children keep TASK).
 * Ensures MySQL `tasks.type` is VARCHAR so values like TICKET are valid even if the column was ENUM before.
 */
@Injectable()
export class TaskTypeDataMigrationService implements OnApplicationBootstrap {
  private readonly log = new Logger(TaskTypeDataMigrationService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    const driver = (this.ds.options as { type?: string }).type;
    if (driver !== 'mysql' && driver !== 'mariadb') {
      this.log.warn(`Task type migration skipped (driver=${driver ?? 'unknown'}, expected mysql/mariadb)`);
      return;
    }

    try {
      await this.ds.query(
        `ALTER TABLE tasks MODIFY COLUMN type VARCHAR(32) NOT NULL DEFAULT 'TICKET'`,
      );
      this.log.log('tasks.type column set to VARCHAR(32) (idempotent ALTER).');
    } catch (e) {
      this.log.warn(`tasks.type ALTER skipped or failed: ${(e as Error).message}`);
    }

    try {
      const r1 = await this.ds.query(`UPDATE tasks SET type = 'TASK' WHERE type = 'SUB_TASK'`);
      const r2 = await this.ds.query(
        `UPDATE tasks SET type = 'TICKET' WHERE type = 'TASK' AND parentId IS NULL`,
      );
      const rows = (r: unknown): number | undefined =>
        r &&
        typeof r === 'object' &&
        'affectedRows' in r &&
        typeof (r as { affectedRows: unknown }).affectedRows === 'number'
          ? (r as { affectedRows: number }).affectedRows
          : undefined;
      const n1 = rows(r1);
      const n2 = rows(r2);
      this.log.log(
        `Task type data migration finished (SUB_TASK→TASK: ${n1 ?? 'n/a'} row(s), root TASK→TICKET: ${n2 ?? 'n/a'} row(s)).`,
      );
    } catch (e) {
      this.log.error(
        `Task type data migration failed: ${(e as Error).message}`,
        (e as Error).stack,
      );
    }
  }
}
