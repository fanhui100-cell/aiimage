// wu-tweaks.jsx — Tweaks panel for the Word Universe galaxy view
/* global TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakButton, useTweaks */

const WU_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "variant": "auto",
  "starSize": 2.0,
  "glow": 3.0,
  "lineStrength": 0,
  "showConfusable": false,
  "drift": true,
  "labelDensity": 48,
  "spread": 2.4,
  "dust": true,
  "bloom": true
}/*EDITMODE-END*/;

function WuTweaks() {
  const [t, setTweak] = useTweaks(WU_TWEAK_DEFAULTS);

  // let the in-page variant bar sync back into the panel
  React.useEffect(() => {
    window.__wuSyncTweak = (k, v) => setTweak(k, v);
    return () => { window.__wuSyncTweak = null; };
  }, [setTweak]);

  // apply to the scene whenever values change (waits for module init)
  React.useEffect(() => {
    let raf;
    const apply = () => {
      if (!window.__wuUI) { raf = requestAnimationFrame(apply); return; }
      window.__wuUI.setVariant(t.variant);
      window.__wuUI.applyConfig({
        starSize: t.starSize, glow: t.glow, lineStrength: t.lineStrength,
        showConfusable: t.showConfusable, drift: t.drift, dust: t.dust, bloom: t.bloom,
      });
      window.__wuUI.setLabelDensity(t.labelDensity);
      window.__wuUI.setSpread(t.spread);
    };
    apply();
    return () => cancelAnimationFrame(raf);
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="布局变体">
        <TweakRadio label="Variant (auto=星系默认)" value={t.variant}
          options={["auto", "nebula", "classic"]}
          onChange={(v) => setTweak('variant', v)} />
      </TweakSection>
      <TweakSection label="星空氛围">
        <TweakSlider label="星点大小" value={t.starSize} min={0.5} max={2.5} step={0.1} onChange={(v) => setTweak('starSize', v)} />
        <TweakSlider label="辉光强度" value={t.glow} min={0} max={3} step={0.1} onChange={(v) => setTweak('glow', v)} />
        <TweakSlider label="星系间距" value={t.spread} min={0.7} max={2.4} step={0.05} onChange={(v) => setTweak('spread', v)} />
        <TweakToggle label="星空漂移" value={t.drift} onChange={(v) => setTweak('drift', v)} />
        <TweakToggle label="尘埃粒子" value={t.dust} onChange={(v) => setTweak('dust', v)} />
        <TweakToggle label="Bloom 辉光 (性能换画质)" value={t.bloom} onChange={(v) => setTweak('bloom', v)} />
      </TweakSection>
      <TweakSection label="星座连线">
        <TweakSlider label="连线强度" value={t.lineStrength} min={0} max={3} step={0.1} onChange={(v) => setTweak('lineStrength', v)} />
        <TweakToggle label="显示易混词线" value={t.showConfusable} onChange={(v) => setTweak('showConfusable', v)} />
      </TweakSection>
      <TweakSection label="标签">
        <TweakSlider label="标签密度" value={t.labelDensity} min={0} max={48} step={2} onChange={(v) => setTweak('labelDensity', v)} />
      </TweakSection>
      <TweakSection label="学习进度">
        <TweakButton label="重置已点亮的星星" secondary onClick={() => window.__wuUI && window.__wuUI.relight()} />
      </TweakSection>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('wu-tweaks-root') || (() => {
  const d = document.createElement('div'); d.id = 'wu-tweaks-root'; document.body.appendChild(d); return d;
})()).render(<WuTweaks />);
