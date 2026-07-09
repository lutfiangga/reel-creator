const voices = [['news', 'News anchor'], ['warm', 'Warm presenter'], ['firm', 'Firm bulletin']];

export default function VoiceStylePicker({ value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {voices.map(([id, label]) => (
        <button key={id} type="button" className={value === id ? 'btn' : 'btn-secondary'} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}
