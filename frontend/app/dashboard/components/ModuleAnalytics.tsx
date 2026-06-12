'use client';

import { Event, MoiEntry } from '@/lib/api';

interface ModuleAnalyticsProps {
  events: Event[];
  entries: MoiEntry[];
  totalMoi: number;
}

export default function ModuleAnalytics({ events, entries, totalMoi }: ModuleAnalyticsProps) {
  const getEventDisplayName = (ev: Event) => {
    const typeLabels: Record<string, string> = {
      wedding: 'Wedding',
      birthday: 'Birthday',
      engagement: 'Engagement',
      valakaappu: 'Valakaappu',
      housewarming: 'Housewarming',
      graduation: 'Graduation',
      custom: ev.custom_title || 'Custom Event',
    };
    const typeName = typeLabels[ev.event_type] || 'Event';
    const dateStr = ev.wedding_date
      ? new Date(ev.wedding_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    return `${typeName} - ${dateStr}`.trim();
  };

  const eventStats = events.map((ev) => {
    const evE   = entries.filter((e) => e.event_id === ev.id);
    const evT   = evE.reduce((s, e) => s + Number(e.amount), 0);
    return { ev, count: evE.length, total: evT, avg: evE.length ? Math.round(evT / evE.length) : 0 };
  }).sort((a, b) => b.total - a.total);

  const byRelation = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.relation] = (acc[e.relation] || 0) + Number(e.amount); return acc;
  }, {} as Record<string, number>);
  const byMode = entries.reduce((acc: Record<string, number>, e) => {
    acc[e.payment_mode] = (acc[e.payment_mode] || 0) + Number(e.amount); return acc;
  }, {} as Record<string, number>);
  const top5 = [...entries].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5);

  const relEmoji: Record<string, string> = { family: '👨‍👩‍👧', friend: '👫', colleague: '💼', other: '🤝' };
  const payEmoji: Record<string, string> = { cash: '💵', upi: '📱', card: '💳', cheque: '📄' };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Collected', value: `₹${totalMoi.toLocaleString('en-IN')}`, icon: '💰' },
          { label: 'Total Entries',   value: String(entries.length),                  icon: '📋' },
          { label: 'Active Events',   value: String(events.filter((e) => e.is_active).length), icon: '💍' },
          { label: 'Avg Gift',        value: entries.length ? `₹${Math.round(totalMoi / entries.length).toLocaleString('en-IN')}` : '₹0', icon: '📊' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#EBEBEB] rounded-xl p-4">
            <span className="text-2xl">{k.icon}</span>
            <p className="text-xl font-bold text-[#101010] mt-2">{k.value}</p>
            <p className="text-xs text-[#999] mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Relation */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">By Relation</h3>
          {Object.keys(byRelation).length === 0 ? (
            <p className="text-[#bbb] text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byRelation).sort((a, b) => b[1] - a[1]).map(([rel, amt]) => {
                const pct = totalMoi ? Math.round((amt / totalMoi) * 100) : 0;
                return (
                  <div key={rel}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#444] capitalize">{relEmoji[rel]} {rel}</span>
                      <span className="text-sm font-semibold text-[#101010]">
                        ₹{amt.toLocaleString('en-IN')} <span className="text-[#bbb] font-normal text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFC107] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Payment Mode */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-5">
          <h3 className="font-semibold text-[#101010] text-sm mb-4">By Payment Mode</h3>
          {Object.keys(byMode).length === 0 ? (
            <p className="text-[#bbb] text-sm">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byMode).sort((a, b) => b[1] - a[1]).map(([mode, amt]) => {
                const pct = totalMoi ? Math.round((amt / totalMoi) * 100) : 0;
                return (
                  <div key={mode}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#444] capitalize">{payEmoji[mode]} {mode}</span>
                      <span className="text-sm font-semibold text-[#101010]">
                        ₹{amt.toLocaleString('en-IN')} <span className="text-[#bbb] font-normal text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#101010] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top events */}
      <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F5F5F5]">
          <h3 className="font-semibold text-[#101010] text-sm">Top Performing Events</h3>
        </div>
        {eventStats.length === 0 ? (
          <div className="py-10 text-center text-[#bbb] text-sm">No events yet.</div>
        ) : (
          <div className="divide-y divide-[#F8F8F8]">
            {eventStats.map(({ ev, count, total, avg }, i) => (
              <div key={ev.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-lg shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i] ?? `${i+1}.`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#101010] text-sm truncate">{getEventDisplayName(ev)}</p>
                  <p className="text-xs text-[#999]">{count} guests · avg ₹{avg.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#101010]">₹{total.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-[#bbb]">collected</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top contributors */}
      {top5.length > 0 && (
        <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#F5F5F5]">
            <h3 className="font-semibold text-[#101010] text-sm">🏆 Top Contributors</h3>
          </div>
          <div className="divide-y divide-[#F8F8F8]">
            {top5.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg shrink-0">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#101010] text-sm">{e.guest_name}</p>
                  <p className="text-xs text-[#999] capitalize">{e.relation} · {e.payment_mode}</p>
                </div>
                <span className="font-bold text-[#101010]">₹{Number(e.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}