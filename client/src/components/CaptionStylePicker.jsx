const styles = ['bold', 'boxed', 'minimal'];

export default function CaptionStylePicker({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {styles.map((style) => (
        <button key={style} type="button" className={value === style ? 'btn' : 'btn-secondary'} onClick={() => onChange(style)}>{style}</button>
      ))}
    </div>
  );
}
