import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  reportsApi,
  type DestinyReport,
  type DestinyReportPayload,
} from '../src/services/api';
import { useUserStore } from '../src/store/user';
import { useI18nStore } from '../src/store/i18n';
import { trackNamedEvent } from '../src/services/analytics';
import { saveTodayTip } from '../src/utils/todayTipStorage';
import { buildReportShareLabel } from '../src/utils/shareLabel';
import DeliveryNextStepCard from '../components/DeliveryNextStepCard';
import EmailCaptureCard from '../components/EmailCaptureCard';
import ResultShareCard from '../components/ResultShareCard';
import TrustStrip from '../components/TrustStrip';

const ui = {
  bg: '#0B0D14',
  card: '#121827',
  border: '#2A3448',
  text: '#E8ECF3',
  textSub: '#AAB3C5',
  gold: '#D6B36A',
  primary: '#7C6CFF',
};

const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  if (!children?.trim()) return null;
  return <Text style={styles.body}>{children}</Text>;
}

function pickYearFocus(payload: DestinyReportPayload) {
  const forecast = payload.detailedReading?.annualForecast || [];
  if (!forecast.length) return null;
  const year = new Date().getFullYear();
  return forecast.find((item) => item.year === year) || forecast[0];
}

function pickWeeklyAction(payload: DestinyReportPayload, yearFocus: ReturnType<typeof pickYearFocus>) {
  const fromSuggestion = payload.suggestions?.find((s) => String(s).trim());
  if (fromSuggestion) return String(fromSuggestion).trim();
  if (yearFocus?.favorable?.trim()) return String(yearFocus.favorable).trim();
  if (payload.conclusion?.mindset?.trim()) return String(payload.conclusion.mindset).trim();
  if (yearFocus?.hint?.trim()) return String(yearFocus.hint).trim();
  return '先把今年最要紧的一件事说清楚，再决定今天能迈出的一小步。';
}

export default function DeepDestinyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useI18nStore((s) => s.t);
  const user = useUserStore((s) => s.user);
  const params = useLocalSearchParams<{ paymentId?: string; paymentid?: string }>();
  const paymentId = useMemo(() => {
    const raw = params.paymentId ?? params.paymentid;
    const v = Array.isArray(raw) ? raw[0] : raw;
    return v ? String(v).trim() : '';
  }, [params.paymentId, params.paymentid]);

  const [report, setReport] = useState<DestinyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullAnnual, setShowFullAnnual] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const viewedKeyRef = useRef<string | null>(null);
  const tipSavedKeyRef = useRef<string | null>(null);
  const awaitingTrackedRef = useRef<string | null>(null);

  const trackCta = useCallback(
    (cta: string, extra?: Record<string, unknown>) => {
      trackNamedEvent('report_cta_click', {
        cta,
        paymentId: report?.paymentId || paymentId || null,
        reportStatus: report?.status || null,
        ...extra,
      });
    },
    [paymentId, report?.paymentId, report?.status],
  );

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setError(t('report.loginRequired', '请先登录后查看报告'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = paymentId
        ? await reportsApi.getDeepDestinyByPayment(paymentId)
        : await reportsApi.getLatestDeepDestiny();
      setReport(resp.report);
      if (!resp.report) {
        setError(t('report.empty', '暂无深度命运报告。购买后可在此随时重开阅读。'));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('report.loadFail', '加载报告失败'));
    } finally {
      setLoading(false);
    }
  }, [paymentId, t, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!report || report.status !== 'generating') return;
    const timer = setInterval(() => {
      load().catch(() => null);
    }, 2500);
    return () => clearInterval(timer);
  }, [report?.status, load]);

  useEffect(() => {
    if (!report) return;
    const key = `${report.id}:${report.status}`;
    if (viewedKeyRef.current === key) return;
    viewedKeyRef.current = key;
    trackNamedEvent('report_view', {
      paymentId: report.paymentId,
      reportId: report.id,
      status: report.status,
      source: paymentId ? 'paymentId' : 'latest',
    });
  }, [report, paymentId]);

  useEffect(() => {
    if (!report || report.status !== 'awaiting_profile') return;
    if (awaitingTrackedRef.current === report.id) return;
    awaitingTrackedRef.current = report.id;
    trackNamedEvent('report_awaiting_profile_shown', {
      paymentId: report.paymentId,
      reportId: report.id,
    });
  }, [report]);

  const payload = (report?.payload || {}) as DestinyReportPayload;
  const pillars = payload.pillars;
  const forecast = payload.detailedReading?.annualForecast || [];
  const yearFocus = useMemo(
    () => pickYearFocus((report?.payload || {}) as DestinyReportPayload),
    [report?.id, report?.updatedAt, report?.payload],
  );
  const weeklyAction = useMemo(
    () => pickWeeklyAction((report?.payload || {}) as DestinyReportPayload, yearFocus),
    [report?.id, report?.updatedAt, report?.payload, yearFocus],
  );

  useEffect(() => {
    if (!report || report.status !== 'ready') return;
    if (tipSavedKeyRef.current === report.id) return;
    tipSavedKeyRef.current = report.id;
    void saveTodayTip({
      tip: weeklyAction,
      source: 'report',
      headline: yearFocus
        ? `${yearFocus.year || ''}年重点`.trim()
        : t('report.tipHeadline', '报告一招'),
    });
  }, [report, weeklyAction, yearFocus, t]);

  const onRefresh = async () => {
    const id = report?.paymentId || paymentId;
    if (!id) {
      await load();
      return;
    }
    setRefreshing(true);
    trackNamedEvent('report_refresh', { paymentId: id, fromStatus: report?.status || null });
    try {
      const resp = await reportsApi.refreshDeepDestiny(id);
      setReport(resp.report);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('report.refreshFail', '重新生成失败'));
    } finally {
      setRefreshing(false);
    }
  };

  const goBazi = () => {
    trackCta('complete_bazi');
    router.push('/(tabs)/bazi');
  };

  const goReadingOnFocus = () => {
    const focusText =
      yearFocus?.masterCommentary ||
      yearFocus?.hint ||
      payload.conclusion?.overall ||
      weeklyAction;
    trackCta('ask_reading', { year: yearFocus?.year || null });
    router.push({
      pathname: '/(tabs)/reading',
      params: {
        suggestedQuestion: `结合我的深度命运报告，今年重点是：${String(focusText).slice(0, 160)}。请先给一句结论，再给本周可执行的一步。`,
        suggestedCategory: 'career',
        from: 'deep_report',
      },
    } as any);
  };

  const goHomeAsk = () => {
    trackCta('ask_home', { year: yearFocus?.year || null });
    router.push({
      pathname: '/(tabs)',
      params: {
        prefill: `我想继续追问深度命运报告里「今年重点」和「本周行动」：${weeklyAction.slice(0, 80)}`,
        from: 'deep_report',
      },
    } as any);
  };

  const goUpgradeVip = () => {
    trackCta('upgrade_monthly');
    router.push({
      pathname: '/(tabs)/points',
      params: { focus: 'vip', from: 'deep_report' },
    } as any);
  };

  const goBuyReport = () => {
    trackCta('buy_report');
    router.push({ pathname: '/(tabs)/points', params: { focus: 'report' } });
  };

  const toggleFullAnnual = () => {
    trackCta(showFullAnnual ? 'collapse_annual' : 'expand_annual');
    setShowFullAnnual((v) => !v);
  };

  const toggleDeepDive = () => {
    trackCta(showDeepDive ? 'collapse_deep' : 'expand_deep');
    setShowDeepDive((v) => !v);
  };

  return (
    <>
      <Stack.Screen options={{ title: t('report.pageTitle', '深度命运报告') }} />
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 8 }]}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.brand}>山海灵境</Text>
        <Text style={styles.title}>{report?.title || t('report.pageTitle', '深度命运报告')}</Text>
        <Text style={styles.lead}>
          {t(
            'report.lead',
            '不是判决，是下一步的坐标。这是一份可保存、可反复打开的专属解读快照。',
          )}
        </Text>
        <TrustStrip compact />

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={ui.gold} size="large" />
            <Text style={styles.hint}>{t('report.loading', '正在打开报告…')}</Text>
          </View>
        ) : error && !report ? (
          <View style={styles.centerBox}>
            <Text style={styles.body}>{error}</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, webPointer]}
              onPress={() => {
                trackCta('login');
                router.push('/login');
              }}
            >
              <Text style={styles.primaryBtnText}>{t('common.login', '去登录')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, webPointer]} onPress={goBuyReport}>
              <Text style={styles.secondaryBtnText}>{t('report.buy', '去购买报告')}</Text>
            </TouchableOpacity>
          </View>
        ) : report?.status === 'awaiting_profile' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.awaitingTitle', '待完善出生信息')}</Text>
            <Body>
              {payload.message ||
                t(
                  'report.awaitingBody',
                  '报告权益已到账。请先填写出生年月日时与性别，保存命盘后再回来生成完整报告。',
                )}
            </Body>
            <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={goBazi}>
              <Text style={styles.primaryBtnText}>{t('report.goBazi', '去完善命盘')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, webPointer]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Text style={styles.secondaryBtnText}>
                {refreshing
                  ? t('common.processing', '处理中')
                  : t('report.retryGenerate', '我已完善，重新生成')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : report?.status === 'generating' ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={ui.gold} size="large" />
            <Text style={styles.hint}>{t('report.generating', '正在生成你的深度报告…')}</Text>
          </View>
        ) : report?.status === 'failed' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('report.failedTitle', '报告生成失败')}</Text>
            <Body>{report.errorMessage || t('report.failedBody', '请稍后重试，或联系客服。')}</Body>
            <TouchableOpacity
              style={[styles.primaryBtn, webPointer]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Text style={styles.primaryBtnText}>
                {refreshing ? t('common.processing', '处理中') : t('report.retry', '重新生成')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* 首屏：四柱 + 总论 */}
            <Section title={t('report.hero', '总论')}>
              {pillars ? (
                <Text style={styles.pillars}>
                  {[pillars.year, pillars.month, pillars.day, pillars.hour]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
              {payload.dayMaster ? (
                <Text style={styles.meta}>
                  {t('report.dayMaster', '日主')}：{payload.dayMaster}
                </Text>
              ) : null}
              {payload.generatedAt ? (
                <Text style={styles.meta}>
                  {t('report.generatedAt', '生成于')}{' '}
                  {new Date(payload.generatedAt).toLocaleString('zh-CN')}
                </Text>
              ) : null}
              <Body>
                {payload.conclusion?.overall ||
                  t('report.conclusionFallback', '先看清方向，再决定这一步怎么走。')}
              </Body>
              {payload.conclusion?.mindset ? <Body>{payload.conclusion.mindset}</Body> : null}
            </Section>

            {/* 第二节：今年重点 */}
            <Section title={t('report.yearFocus', '今年重点')}>
              {yearFocus ? (
                <>
                  <Text style={styles.forecastTitle}>
                    {yearFocus.year} {yearFocus.ganZhi || ''}{' '}
                    {yearFocus.tenGod ? `· ${yearFocus.tenGod}` : ''}
                  </Text>
                  {yearFocus.hint ? <Body>{yearFocus.hint}</Body> : null}
                  {yearFocus.masterCommentary ? (
                    <Text style={styles.master}>{yearFocus.masterCommentary}</Text>
                  ) : null}
                  {yearFocus.favorable ? <Body>{`宜：${yearFocus.favorable}`}</Body> : null}
                  {yearFocus.caution ? <Body>{`忌：${yearFocus.caution}`}</Body> : null}
                </>
              ) : (
                <Body>
                  {payload.detailedReading?.corePattern ||
                    t('report.yearFocusFallback', '完善命盘后可生成更完整的流年批注。')}
                </Body>
              )}
            </Section>

            {/* 第三节：本周行动 */}
            <DeliveryNextStepCard
              title={t('report.weeklyAction', '本周可做的 1 件事')}
              summary={weeklyAction}
              primary={{
                label: t('report.cta.reading', '针对这点去解签'),
                onPress: goReadingOnFocus,
              }}
              secondary={{
                label: t('report.cta.ask', '继续追问'),
                onPress: goHomeAsk,
              }}
              tertiary={{
                label: t('report.cta.bazi', '完善命盘'),
                onPress: goBazi,
              }}
            />

            <View style={styles.ctaRow}>
              <TouchableOpacity style={[styles.chipBtn, webPointer]} onPress={toggleFullAnnual}>
                <Text style={styles.chipBtnText}>
                  {showFullAnnual
                    ? t('report.hideAnnual', '收起完整流年')
                    : t('report.showAnnual', '查看完整流年')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chipBtn, webPointer]} onPress={toggleDeepDive}>
                <Text style={styles.chipBtnText}>
                  {showDeepDive
                    ? t('report.hideDeep', '收起详细解读')
                    : t('report.showDeep', '查看详细解读')}
                </Text>
              </TouchableOpacity>
            </View>

            {showFullAnnual && forecast.length > 0 ? (
              <Section title={t('report.annual', '流年批注')}>
                {forecast.map((item) => (
                  <View key={`${item.year}-${item.ganZhi}`} style={styles.forecastItem}>
                    <Text style={styles.forecastTitle}>
                      {item.year} {item.ganZhi || ''} {item.tenGod ? `· ${item.tenGod}` : ''}
                    </Text>
                    {item.hint ? <Body>{item.hint}</Body> : null}
                    {item.masterCommentary ? (
                      <Text style={styles.master}>{item.masterCommentary}</Text>
                    ) : null}
                    {item.favorable ? <Body>{`宜：${item.favorable}`}</Body> : null}
                    {item.caution ? <Body>{`忌：${item.caution}`}</Body> : null}
                  </View>
                ))}
              </Section>
            ) : null}

            {showDeepDive ? (
              <>
                {payload.personalityTraits?.length ? (
                  <Section title={t('report.personality', '性格特质')}>
                    {payload.personalityTraits.map((item) => (
                      <Text key={item} style={styles.bullet}>
                        • {item}
                      </Text>
                    ))}
                  </Section>
                ) : null}

                {payload.fortuneSummary ? (
                  <Section title={t('report.fortune', '运势概览')}>
                    {payload.fortuneSummary.career ? (
                      <Body>{`事业：${payload.fortuneSummary.career}`}</Body>
                    ) : null}
                    {payload.fortuneSummary.wealth ? (
                      <Body>{`财运：${payload.fortuneSummary.wealth}`}</Body>
                    ) : null}
                    {payload.fortuneSummary.love ? (
                      <Body>{`感情：${payload.fortuneSummary.love}`}</Body>
                    ) : null}
                    {payload.fortuneSummary.health ? (
                      <Body>{`健康：${payload.fortuneSummary.health}`}</Body>
                    ) : null}
                  </Section>
                ) : null}

                {payload.detailedReading?.corePattern ? (
                  <Section title={t('report.core', '核心格局')}>
                    <Body>{payload.detailedReading.corePattern}</Body>
                  </Section>
                ) : null}

                {payload.detailedReading?.career ||
                payload.detailedReading?.wealth ||
                payload.detailedReading?.relationship ||
                payload.detailedReading?.health ? (
                  <Section title={t('report.detail', '分项解读')}>
                    {payload.detailedReading.career ? (
                      <Body>{`事业：${payload.detailedReading.career}`}</Body>
                    ) : null}
                    {payload.detailedReading.wealth ? (
                      <Body>{`财运：${payload.detailedReading.wealth}`}</Body>
                    ) : null}
                    {payload.detailedReading.relationship ? (
                      <Body>{`关系：${payload.detailedReading.relationship}`}</Body>
                    ) : null}
                    {payload.detailedReading.health ? (
                      <Body>{`健康：${payload.detailedReading.health}`}</Body>
                    ) : null}
                  </Section>
                ) : null}

                {payload.suggestions?.length ? (
                  <Section title={t('report.suggestions', '行动建议')}>
                    {payload.suggestions.map((item) => (
                      <Text key={item} style={styles.bullet}>
                        • {item}
                      </Text>
                    ))}
                  </Section>
                ) : null}
              </>
            ) : null}

            <ResultShareCard
              kind="report"
              headline={
                payload.conclusion?.overall ||
                t('report.share.headline', '我的深度命运报告')
              }
              summary={weeklyAction}
              shareLabel={buildReportShareLabel({
                yearFocus: yearFocus
                  ? `${yearFocus.year || ''} ${yearFocus.tenGod || yearFocus.hint || ''}`.trim()
                  : '',
                weeklyAction,
                overall: payload.conclusion?.overall,
              })}
              badge={t('report.share.badge', '深度命运报告')}
              referralCode={user?.referralCode || (user?.id ?? null)}
            />

            <EmailCaptureCard
              source="deep_report"
              title={t('report.email.title', '把报告摘要发到邮箱')}
              subtitle={t(
                'report.email.sub',
                '留下邮箱，便于日后找回这份可重开报告，并接收每周提醒（可随时退订）。',
              )}
            />

            <View style={styles.upgradeCard}>
              <Text style={styles.upgradeTitle}>
                {t('report.upgrade.title', '想持续追问这份报告？')}
              </Text>
              <Text style={styles.upgradeBody}>
                {t(
                  'report.upgrade.body',
                  '月卡 $5.9：深度解签/测字按会员规则免扣积分，适合把报告变成每周对话。',
                )}
              </Text>
              <TouchableOpacity style={[styles.primaryBtn, webPointer]} onPress={goUpgradeVip}>
                <Text style={styles.primaryBtnText}>
                  {t('report.upgrade.cta', '查看月卡权益')}
                </Text>
              </TouchableOpacity>
            </View>

            {payload.detailedReading?.disclaimer ? (
              <Text style={styles.disclaimer}>{payload.detailedReading.disclaimer}</Text>
            ) : (
              <Text style={styles.disclaimer}>
                {t(
                  'report.disclaimer',
                  '本报告仅供自我反思与娱乐参考，不构成医疗、法律或财务建议。',
                )}
              </Text>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.secondaryBtn, webPointer]}
          onPress={() => {
            trackCta('back_points');
            router.replace('/(tabs)/points' as any);
          }}
        >
          <Text style={styles.secondaryBtnText}>{t('report.backPoints', '返回灵石')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  brand: {
    color: ui.gold,
    fontSize: 13,
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    color: ui.text,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  lead: {
    color: ui.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  hint: { color: ui.textSub, fontSize: 14 },
  section: {
    backgroundColor: ui.card,
    borderColor: ui.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: ui.gold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  body: {
    color: ui.text,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  bullet: {
    color: ui.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  pillars: {
    color: ui.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  meta: {
    color: ui.textSub,
    fontSize: 13,
    marginBottom: 4,
  },
  forecastItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    paddingTop: 10,
    marginTop: 8,
  },
  forecastTitle: {
    color: ui.gold,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  master: {
    color: '#C9B8FF',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chipBtn: {
    borderColor: ui.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ui.card,
  },
  chipBtnText: {
    color: ui.textSub,
    fontSize: 13,
    fontWeight: '600',
  },
  upgradeCard: {
    backgroundColor: ui.card,
    borderColor: 'rgba(214, 179, 106, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  upgradeTitle: {
    color: ui.gold,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  upgradeBody: {
    color: ui.textSub,
    fontSize: 14,
    lineHeight: 22,
  },
  disclaimer: {
    color: ui.textSub,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: ui.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderColor: ui.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: {
    color: ui.text,
    fontSize: 15,
  },
});
