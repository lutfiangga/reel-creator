function calculateTimeline(totalDuration, assets) {
  const target = Math.max(0, Number(totalDuration || 0) - 5);
  if (!assets.length || !target) return assets.map((asset) => ({ ...asset, calculated_duration: 0 }));

  const flexible = assets.filter((asset) => !Number(asset.custom_duration));
  const fixedTotal = assets.reduce((sum, asset) => sum + (Number(asset.custom_duration) || 0), 0);
  const base = flexible.length ? Math.max(0.5, (target - fixedTotal) / flexible.length) : 0;
  let used = 0;

  return assets.map((asset, index) => {
    const custom = Number(asset.custom_duration) || 0;
    let duration = custom || (asset.type === 'image' ? Math.min(5, base || 5) : base);
    if (index === assets.length - 1) duration = Math.max(0.5, target - used);
    used += duration;
    return { ...asset, calculated_duration: Number(duration.toFixed(2)), order_index: index };
  });
}

module.exports = { calculateTimeline };

if (require.main === module) {
  const out = calculateTimeline(20, [{ type: 'image' }, { type: 'video' }, { type: 'image', custom_duration: 4 }]);
  console.assert(out.reduce((n, a) => n + a.calculated_duration, 0) === 15, 'timeline fits voice duration');
  console.log('timeline ok');
}
