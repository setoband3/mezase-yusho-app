"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardData } from "../dashboard-types";

function formatYen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function SettingsClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [newStaffName, setNewStaffName] = useState("");
  const [goalAmount, setGoalAmount] = useState(String(initialData.goal.totalTargetAmount));
  const [startDate, setStartDate] = useState(initialData.goal.startDate);
  const [endDate, setEndDate] = useState(initialData.goal.endDate);
  const [holidayDates, setHolidayDates] = useState<string[]>(initialData.goal.holidayDates);
  const [calendarYearMonth, setCalendarYearMonth] = useState(
    initialData.goal.startDate.slice(0, 7),
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const holidaySet = useMemo(() => new Set(holidayDates), [holidayDates]);
  const calendarCells = useMemo(() => {
    const [y, m] = calendarYearMonth.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const startWeekday = firstDay.getDay();
    const gridStart = new Date(y, m - 1, 1 - startWeekday);
    return Array.from({ length: 42 }).map((_, idx) => {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + idx);
      const ymd = toYmd(cellDate);
      return {
        ymd,
        day: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === m - 1,
      };
    });
  }, [calendarYearMonth]);

  async function refreshDashboard() {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const next = (await response.json()) as DashboardData;
    setData(next);
    setGoalAmount(String(next.goal.totalTargetAmount));
    setStartDate(next.goal.startDate);
    setEndDate(next.goal.endDate);
    setHolidayDates(next.goal.holidayDates);
  }

  async function submitWithRefresh(
    url: string,
    payload: Record<string, number | string | string[] | boolean>,
    successMessage: string,
    method = "POST",
  ) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "処理に失敗しました。");
      }
      await refreshDashboard();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "処理に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function onAddStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitWithRefresh("/api/staff", { name: newStaffName }, "担当者を追加しました。");
    setNewStaffName("");
  }

  async function onDeleteStaff(staffId: string, name: string) {
    const ok = window.confirm(`${name}さんを削除しますか？`);
    if (!ok) {
      return;
    }
    await submitWithRefresh(
      "/api/staff",
      { staffId },
      `${name}さんを削除しました。`,
      "DELETE",
    );
  }

  async function onSaveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitWithRefresh(
      "/api/goal",
      {
        totalTargetAmount: Number(goalAmount),
        startDate,
        endDate,
        holidayDates,
      },
      "設定を保存しました。",
    );
  }

  async function onResetAll() {
    const ok = window.confirm(
      "担当者以外のデータ（目標金額・売上・入室記録）をリセットしますか？",
    );
    if (!ok) {
      return;
    }

    const clearCalendar = window.confirm(
      "休業日カレンダーも消しますか？\nOK: 消す / キャンセル: 残す",
    );

    await submitWithRefresh(
      "/api/reset",
      { clearHolidayDates: clearCalendar },
      clearCalendar
        ? "リセット完了（休業日もクリア）"
        : "リセット完了（休業日は保持）",
    );
  }

  function onRemoveHoliday(target: string) {
    setHolidayDates((prev) => prev.filter((day) => day !== target));
  }

  function onToggleHoliday(target: string) {
    setHolidayDates((prev) => {
      if (prev.includes(target)) {
        return prev.filter((day) => day !== target);
      }
      return [...prev, target].sort();
    });
  }

  function moveMonth(step: number) {
    const [y, m] = calendarYearMonth.split("-").map(Number);
    const next = new Date(y, m - 1 + step, 1);
    setCalendarYearMonth(toYearMonth(next));
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 bg-gradient-to-b from-sky-50 to-amber-50 p-4 md:p-8">
      <section className="rounded-2xl border-2 border-sky-300 bg-white p-4 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-extrabold text-slate-900">初期設定ページ</h1>
          <Link href="/" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-bold text-white">
            ホームへ戻る
          </Link>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-700">
          担当者・目標・稼働日をここで設定します。普段はホーム画面だけ見ればOKです。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form
          onSubmit={onAddStaff}
          className="space-y-3 rounded-2xl border-2 border-amber-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">担当者マスタ</h2>
          <input
            className="w-full rounded-md border-2 border-slate-300 px-3 py-2 text-slate-900"
            placeholder="担当者名"
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="rounded-md bg-amber-500 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            追加する
          </button>

          <div className="space-y-2 rounded-md bg-amber-50 p-3 text-sm text-slate-800">
            <p className="font-semibold">登録済み担当者</p>
            {data.staffRows.length === 0 && <p>なし</p>}
            {data.staffRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-2 rounded bg-white p-2">
                <span>{row.name}</span>
                <button
                  type="button"
                  onClick={() => onDeleteStaff(row.id, row.name)}
                  className="rounded bg-rose-500 px-2 py-1 text-xs font-bold text-white"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={onSaveGoal}
          className="space-y-3 rounded-2xl border-2 border-cyan-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">目標・稼働日設定</h2>
          <input
            type="number"
            min={0}
            className="w-full rounded-md border-2 border-slate-300 px-3 py-2 text-slate-900"
            placeholder="全体目標金額"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            required
          />
          <label className="text-sm font-semibold text-slate-700">開始日</label>
          <input
            type="date"
            className="w-full rounded-md border-2 border-slate-300 px-3 py-2 text-slate-900"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <label className="text-sm font-semibold text-slate-700">終了日</label>
          <input
            type="date"
            className="w-full rounded-md border-2 border-slate-300 px-3 py-2 text-slate-900"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />

          <div className="rounded-md border border-dashed border-cyan-300 bg-cyan-50 p-2">
            <p className="mt-3 text-sm font-semibold text-slate-800">
              休業日を追加（月カレンダーで複数選択）
            </p>
            <div className="mt-2 rounded-md border border-cyan-200 bg-white p-2">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  className="rounded bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-900"
                >
                  前月
                </button>
                <p className="text-sm font-bold text-slate-800">{calendarYearMonth}</p>
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  className="rounded bg-cyan-100 px-2 py-1 text-xs font-bold text-cyan-900"
                >
                  次月
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-500">
                <span>日</span>
                <span>月</span>
                <span>火</span>
                <span>水</span>
                <span>木</span>
                <span>金</span>
                <span>土</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  const disabledByPeriod = cell.ymd < startDate || cell.ymd > endDate;
                  const isHoliday = holidaySet.has(cell.ymd);
                  return (
                    <button
                      key={cell.ymd}
                      type="button"
                      disabled={disabledByPeriod}
                      onClick={() => onToggleHoliday(cell.ymd)}
                      className={`rounded py-1 text-xs font-semibold ${
                        !cell.isCurrentMonth
                          ? "bg-slate-100 text-slate-400"
                          : isHoliday
                            ? "bg-rose-300 text-rose-950"
                            : "bg-cyan-50 text-slate-800"
                      } disabled:opacity-30`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {holidayDates.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => onRemoveHoliday(day)}
                  className="rounded-full bg-cyan-200 px-3 py-1 text-xs font-semibold text-cyan-900"
                >
                  {day} ×
                </button>
              ))}
            </div>
          </div>

          <div className="text-sm font-semibold text-slate-800">
            稼働日数（全体）: {data.totalWorkDays}日
            <br />
            残稼働日数: {data.remainingWorkDays}日
            <br />
            残目標金額: {formatYen(data.remainingTarget)}
            <br />
            1日あたり全体目標: {formatYen(data.perDayTeamTarget)}
            <br />
            1人あたり1日目標: {formatYen(data.perDayPerStaffTarget)}
          </div>

          <div className="flex gap-2">
            <button
              disabled={loading}
              className="rounded-md bg-cyan-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              保存する
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onResetAll}
              className="rounded-md bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              リセット
            </button>
          </div>
        </form>
      </section>

      {message && (
        <section className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
          {message}
        </section>
      )}
    </main>
  );
}
