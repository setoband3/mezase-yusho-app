"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { DashboardData } from "./dashboard-types";

function formatYen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

function formatSignedYen(value: number) {
  const abs = Math.abs(value).toLocaleString("ja-JP");
  if (value > 0) {
    return `+¥${abs}`;
  }
  if (value < 0) {
    return `-¥${abs}`;
  }
  return "¥0";
}

function getCheerMessage(rate: number) {
  if (rate >= 120) return "完全にゾーン入ってます！このまま優勝！";
  if (rate >= 100) return "ナイス達成！今日は祝勝ムードです！";
  if (rate >= 80) return "あと少し！次の1本で達成です！";
  if (rate > 0) return "いいスタート！コツコツ積み上げましょう！";
  return "最初の1件いきましょう！ここから逆転！";
}

function getBadge(rate: number) {
  if (rate >= 120) return "LEGEND";
  if (rate >= 100) return "WINNER";
  if (rate >= 80) return "CHASE";
  if (rate > 0) return "START";
  return "READY";
}

function getLegendClass(rate: number) {
  if (rate >= 120) {
    return "legend-on";
  }
  return "";
}

function getStreakRank(streakDays: number) {
  if (streakDays >= 14) {
    return {
      label: "GOLD",
      className: "bg-yellow-300 text-yellow-950",
    };
  }
  if (streakDays >= 7) {
    return {
      label: "SILVER",
      className: "bg-slate-300 text-slate-900",
    };
  }
  if (streakDays >= 3) {
    return {
      label: "BRONZE",
      className: "bg-amber-300 text-amber-950",
    };
  }
  return {
    label: "ROOKIE",
    className: "bg-cyan-200 text-cyan-950",
  };
}

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loggedInStaffId] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem("meza-se-user-id") ?? "";
  });
  const [saleAmount, setSaleAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const staffNameMap = useMemo(() => {
    const map = new Map<string, string>();
    data.staffRows.forEach((row) => {
      map.set(row.id, row.name);
    });
    return map;
  }, [data.staffRows]);
  const selectedStaff = useMemo(
    () => data.staffRows.find((row) => row.id === loggedInStaffId),
    [data.staffRows, loggedInStaffId],
  );
  const selectedStaffRank = selectedStaff
    ? getStreakRank(selectedStaff.streakDays)
    : undefined;

  useEffect(() => {
    if (!loggedInStaffId) {
      window.location.href = "/login";
    }
  }, [loggedInStaffId]);

  async function refreshDashboard() {
    const response = await fetch("/api/dashboard", { cache: "no-store" });
    const next = (await response.json()) as DashboardData;
    setData(next);
    if (
      loggedInStaffId &&
      !next.staffRows.some((row) => row.id === loggedInStaffId)
    ) {
      window.localStorage.removeItem("meza-se-user-id");
      window.location.href = "/login";
    }
  }

  async function submitWithRefresh(
    url: string,
    payload: Record<string, number | string | string[]>,
    successMessage: string,
  ) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "POST",
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

  async function onAddSales(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loggedInStaffId) {
      setMessage("先にログインしてください。");
      return;
    }
    await submitWithRefresh(
      "/api/sales",
      { staffId: loggedInStaffId, amount: Number(saleAmount) },
      "売上を登録しました。",
    );
    setSaleAmount("");
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 bg-gradient-to-b from-amber-50 to-cyan-50 p-4 md:p-8">
      <section className="rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">目指せ優勝！</h1>
            <p className="mt-1 text-base font-bold text-amber-700">今日はどこまでいける？</p>
          </div>
        </div>
        <p className="mt-1 text-sm font-medium text-slate-700">
          今日: {data.today} / 入力はスマホでも利用できます。
        </p>
      </section>

      {selectedStaff && (
        <section
          className={`party-pop rounded-2xl border-2 border-amber-300 bg-white p-4 shadow-md ${
            selectedStaff.dailyRate >= 100 ? "confetti-on" : ""
          } ${getLegendClass(selectedStaff.dailyRate)} ${
            selectedStaff.dailyRate >= 120 ? "border-yellow-400" : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {selectedStaff.name}さんの今日のヒーローカード
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${selectedStaffRank?.className}`}
              >
                {selectedStaffRank?.label}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                  selectedStaff.dailyRate >= 120
                    ? "bg-yellow-300 text-yellow-950"
                    : "bg-amber-400 text-amber-950"
                }`}
              >
                {getBadge(selectedStaff.dailyRate)}
              </span>
            </div>
          </div>
          <p
            className={`mt-1 text-sm font-bold ${
              selectedStaff.dailyRate >= 120 ? "text-yellow-900" : "text-slate-700"
            }`}
          >
            {getCheerMessage(selectedStaff.dailyRate)}
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <div className="rounded-xl bg-cyan-100 p-3">
              <p className="text-xs font-bold text-cyan-900">今日の目標</p>
              <p className="text-3xl font-extrabold text-slate-900">
                {formatYen(selectedStaff.dailyTarget)}
              </p>
            </div>
            <div className="rounded-xl bg-lime-100 p-3">
              <p className="text-xs font-bold text-lime-900">今日の売上</p>
              <p className="text-3xl font-extrabold text-slate-900">
                {formatYen(selectedStaff.todaySales)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3">
              <p className="text-xs font-bold text-amber-900">あと</p>
              <p className="text-3xl font-extrabold text-slate-900">
                {formatYen(selectedStaff.remainingForToday)}
              </p>
            </div>
          </div>
          <p className="mt-1 text-sm font-extrabold text-amber-800">
            連続達成: {selectedStaff.streakDays}日
          </p>
          <div className="mt-3 h-4 w-full rounded-full bg-amber-100">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-fuchsia-500 transition-all"
              style={{ width: `${Math.min(selectedStaff.dailyRate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-right text-lg font-extrabold text-fuchsia-700">
            {selectedStaff.dailyRate.toFixed(1)}%
          </p>
        </section>
      )}

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-2xl border-2 border-cyan-300 bg-cyan-100 p-4">
          <p className="text-sm font-semibold text-cyan-900">今日の全体目標</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatYen(data.perDayTeamTarget)}</p>
          <p className="text-sm font-semibold text-slate-800">達成率: {data.todayTeamRate.toFixed(1)}%</p>
        </article>
        <article className="rounded-2xl border-2 border-lime-300 bg-lime-100 p-4">
          <p className="text-sm font-semibold text-lime-900">今日の全体売上</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatYen(data.todayTeamSales)}</p>
          <p className="text-sm font-semibold text-slate-800">あと {formatYen(data.todayTeamRemaining)}</p>
        </article>
        <article className="rounded-2xl border-2 border-fuchsia-300 bg-fuchsia-100 p-4">
          <p className="text-sm font-semibold text-fuchsia-900">最終目標の進捗</p>
          <p className="text-2xl font-extrabold text-slate-900">{data.totalRate.toFixed(1)}%</p>
          <p className="text-sm font-semibold text-slate-800">残り {formatYen(data.totalRemaining)}</p>
        </article>
      </section>

      <section className="space-y-3 rounded-2xl border-2 border-lime-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">今日の売上入力</h2>
        {data.inputLock.isLocked && (
          <div className="rounded-lg border-2 border-rose-300 bg-rose-50 p-3 text-sm font-bold text-rose-800">
            入力ロック中: {data.inputLock.previousWorkingDay} が未入室です（
            {data.inputLock.pendingStaffNames.join(" / ")}）
          </div>
        )}
        <form onSubmit={onAddSales} className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border-2 border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800">
            ログイン担当者: {selectedStaff?.name ?? "未ログイン"}
          </div>
          <input
            type="number"
            className="rounded-md border-2 border-slate-300 px-3 py-2 text-slate-900"
            placeholder="売上金額（訂正はマイナス入力）"
            value={saleAmount}
            onChange={(e) => setSaleAmount(e.target.value)}
            disabled={data.inputLock.isLocked}
            required
          />
          <button
            disabled={loading || data.staffRows.length === 0 || data.inputLock.isLocked}
            className="rounded-md bg-lime-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            売上を追加
          </button>
        </form>
      </section>

      <section className="rounded-2xl border-2 border-fuchsia-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">担当者ごとの達成状況（今日）</h2>
        <div className="space-y-2">
          {data.staffRows.map((row) => (
            <article key={row.id} className="rounded-lg border-2 border-fuchsia-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{row.name}</p>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-extrabold ${getStreakRank(row.streakDays).className}`}
                >
                  {getStreakRank(row.streakDays).label}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800">
                目標 {formatYen(row.dailyTarget)} / 売上 {formatYen(row.todaySales)} / 達成率{" "}
                {row.dailyRate.toFixed(1)}% / あと {formatYen(row.remainingForToday)} / 連続達成{" "}
                {row.streakDays}日
              </p>
            </article>
          ))}
          {data.staffRows.length === 0 && (
            <p className="text-sm font-medium text-slate-600">まずは担当者を登録してください。</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-violet-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-slate-900">今日の売上ログ（最新20件）</h2>
        <div className="space-y-1 text-sm">
          {data.recentSales.map((sale) => (
            <p
              key={sale.id}
              className={`font-semibold ${
                sale.amount < 0 ? "text-rose-700" : "text-slate-800"
              }`}
            >
              {new Date(sale.createdAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              - {staffNameMap.get(sale.staffId) ?? "不明"}: {formatSignedYen(sale.amount)}
            </p>
          ))}
          {data.recentSales.length === 0 && (
            <p className="font-medium text-slate-600">まだ売上入力がありません。</p>
          )}
        </div>
      </section>

      {data.notInputStaff.length > 0 && (
        <section className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          未入室担当者（将来ロック対象候補）: {data.notInputStaff.join(" / ")}
        </section>
      )}

      <section className="flex items-center justify-between">
        <Link
          href="/settings"
          className="rounded-md bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white"
        >
          設定ページへ
        </Link>
        <button
          type="button"
          onClick={() => {
            window.localStorage.removeItem("meza-se-user-id");
            window.location.href = "/login";
          }}
          className="rounded-md bg-slate-700 px-4 py-2 text-center text-sm font-bold text-white"
        >
          退出
        </button>
      </section>

      {message && (
        <section className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 text-sm font-semibold text-blue-800">
          {message}
        </section>
      )}
    </main>
  );
}
