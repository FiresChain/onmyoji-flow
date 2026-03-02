import { beforeEach, describe, expect, it } from 'vitest';
import { useToolbarDialogState } from '@/components/composables/useToolbarDialogState';

interface ToolbarDialogStateTestContext {
  state: {
    showWatermarkDialog: boolean;
    showUpdateLogDialog: boolean;
    showFeedbackFormDialog: boolean;
  };
  composable: ReturnType<typeof useToolbarDialogState>;
}

const createContext = (isEmbed = false, currentAppVersion = '2.0.0'): ToolbarDialogStateTestContext => {
  const state = {
    showWatermarkDialog: false,
    showUpdateLogDialog: false,
    showFeedbackFormDialog: false,
  };

  const composable = useToolbarDialogState({
    state,
    isEmbed,
    currentAppVersion,
  });

  return {
    state,
    composable,
  };
};

describe('useToolbarDialogState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('mountDialogState keeps update-log auto-open behavior for version changes', () => {
    localStorage.setItem('appVersion', '1.0.0');
    const context = createContext(false, '2.0.0');

    context.composable.mountDialogState();

    expect(context.state.showUpdateLogDialog).toBe(true);
    expect(localStorage.getItem('appVersion')).toBe('2.0.0');
  });

  it('mountDialogState keeps embed-noop behavior', () => {
    localStorage.setItem('appVersion', '1.0.0');
    const context = createContext(true, '2.0.0');

    context.composable.mountDialogState();

    expect(context.state.showUpdateLogDialog).toBe(false);
    expect(localStorage.getItem('appVersion')).toBe('1.0.0');
  });

  it('mountDialogState keeps same-version noop behavior', () => {
    localStorage.setItem('appVersion', '2.0.0');
    const context = createContext(false, '2.0.0');

    context.composable.mountDialogState();

    expect(context.state.showUpdateLogDialog).toBe(false);
    expect(localStorage.getItem('appVersion')).toBe('2.0.0');
  });

  it('showUpdateLog and showFeedbackForm keep toggle behavior', () => {
    const context = createContext();

    context.composable.showUpdateLog();
    context.composable.showFeedbackForm();
    expect(context.state.showUpdateLogDialog).toBe(true);
    expect(context.state.showFeedbackFormDialog).toBe(true);

    context.composable.showUpdateLog();
    context.composable.showFeedbackForm();
    expect(context.state.showUpdateLogDialog).toBe(false);
    expect(context.state.showFeedbackFormDialog).toBe(false);
  });

  it('openWatermarkDialog and applyWatermarkSettings keep open-persist-close behavior', () => {
    const context = createContext();

    context.composable.openWatermarkDialog();
    expect(context.state.showWatermarkDialog).toBe(true);

    context.composable.watermark.text = '测试水印';
    context.composable.watermark.fontSize = 40;
    context.composable.watermark.color = 'rgba(1, 2, 3, 0.4)';
    context.composable.watermark.angle = -12;
    context.composable.watermark.rows = 2;
    context.composable.watermark.cols = 3;

    context.composable.applyWatermarkSettings();

    expect(localStorage.getItem('watermark.text')).toBe('测试水印');
    expect(localStorage.getItem('watermark.fontSize')).toBe('40');
    expect(localStorage.getItem('watermark.color')).toBe('rgba(1, 2, 3, 0.4)');
    expect(localStorage.getItem('watermark.angle')).toBe('-12');
    expect(localStorage.getItem('watermark.rows')).toBe('2');
    expect(localStorage.getItem('watermark.cols')).toBe('3');
    expect(context.state.showWatermarkDialog).toBe(false);
  });

  it('watermark initialization keeps persisted values and numeric fallback behavior', () => {
    localStorage.setItem('watermark.text', '已持久化水印');
    localStorage.setItem('watermark.fontSize', 'invalid');
    localStorage.setItem('watermark.color', 'rgba(11, 22, 33, 0.4)');
    localStorage.setItem('watermark.angle', '-18');
    localStorage.setItem('watermark.rows', 'NaN');
    localStorage.setItem('watermark.cols', '4');

    const context = createContext();

    expect(context.composable.watermark.text).toBe('已持久化水印');
    expect(context.composable.watermark.fontSize).toBe(30);
    expect(context.composable.watermark.color).toBe('rgba(11, 22, 33, 0.4)');
    expect(context.composable.watermark.angle).toBe(-18);
    expect(context.composable.watermark.rows).toBe(1);
    expect(context.composable.watermark.cols).toBe(4);
  });
});
