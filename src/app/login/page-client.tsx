"use client";

import { useEffect, useState } from "react";

type StaffRow = {
  id: string;
  name: string;
};

export function LoginClient() {
  const [staffRows, setStaffRows] = useState<StaffRow[]>([]);
  const [staffId, setStaffId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { staffRows: StaffRow[] }) => {
        setStaffRows(data.staffRows);
        if (data.staffRows.length > 0) {
          setStaffId(data.staffRows[0].id);
        }
      })
      .catch(() => setMessage("担当者の読み込みに失敗しました。"));
  }, []);

  async function onLogin() {
    if (!staffId) {
      setMessage("担当者を選択してください。");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });
      const result = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(result.message ?? "ログインに失敗しました。");
      }
      window.localStorage.setItem("meza-se-user-id", staffId);
      window.location.href = "/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <section className="w-full rounded-2xl border-2 border-sky-300 bg-white p-5 shadow-md">
        <h1 className="text-2xl font-extrabold text-slate-900">目指せ優勝！ログイン</h1>
        <p className="mt-1 text-sm font-medium text-slate-700">
          担当者を選ぶと、当日チェックインされます。
        </p>
        <select
          className="mt-4 w-full rounded-md border-2 border-slate-300 px-3 py-2 font-semibold text-slate-900"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
        >
          {staffRows.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          選択中: {staffRows.find((row) => row.id === staffId)?.name ?? "未選択"}
        </p>
        <button
          type="button"
          onClick={onLogin}
          disabled={loading || staffRows.length === 0}
          className="mt-3 w-full rounded-md bg-sky-600 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          この担当者で入る
        </button>
        {staffRows.length === 0 && (
          <p className="mt-2 text-sm text-rose-700">
            担当者が未登録です。設定画面から追加してください。
          </p>
        )}
        {message && <p className="mt-2 text-sm font-semibold text-rose-700">{message}</p>}
      </section>
    </main>
  );
}
