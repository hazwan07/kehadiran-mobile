/**
 * app/(main)/history.tsx
 * 
 * Attendance history screen — Live data dari backend API.
 * Memaparkan rekod clock-in/clock-out pekerja dari Firebase.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/auth.store';
import apiClient from '../../services/api.service';
import Card from '../../components/ui/Card';
import StatusChip from '../../components/ui/StatusChip';

type FilterType = 'ALL' | 'CLOCK_IN' | 'CLOCK_OUT';

type HistoryRecord = {
  attendanceId: string;
  checkType: 'CLOCK_IN' | 'CLOCK_OUT';
  serverTimestamp: number;
  status: 'APPROVED' | 'APPROVED_FLAGGED' | 'REJECTED';
  projectSiteId: string;
  distanceFromSite: number;
  anomalyScore: number;
  gpsAccuracy: number;
};

export default function HistoryScreen() {
  const { employee } = useAuthStore();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!employee) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: { records: HistoryRecord[] };
      }>('/api/v1/attendance/history?limit=50');

      if (response.data.success) {
        setRecords(response.data.data.records || []);
      } else {
        setError('Gagal mendapatkan rekod kehadiran.');
      }
    } catch (e) {
      setError('Tiada sambungan ke pelayan. Semak WiFi/Data anda.');
      console.error('[History] Fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employee]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredRecords = records.filter((item) => {
    if (filter === 'ALL') return true;
    return item.checkType === filter;
  });

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('ms-MY', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return { date: `${day}/${month}/${year}`, time };
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Lulus', status: 'success' as const };
      case 'APPROVED_FLAGGED':
        return { label: 'Ditanda', status: 'warning' as const };
      case 'REJECTED':
        return { label: 'Ditolak', status: 'danger' as const };
      default:
        return { label: status, status: 'neutral' as const };
    }
  };

  const renderItem = ({ item }: { item: HistoryRecord }) => {
    const { date, time } = formatDateTime(item.serverTimestamp);
    const statusConfig = getStatusConfig(item.status);

    return (
      <Card variant="bordered" style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            {/* Type & Time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons
                name={item.checkType === 'CLOCK_IN' ? 'log-in-outline' : 'log-out-outline'}
                size={18}
                color={item.checkType === 'CLOCK_IN' ? '#10b981' : '#ef4444'}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '700' }}>
                {item.checkType === 'CLOCK_IN' ? 'Masuk' : 'Keluar'}
              </Text>
              <Text style={{ color: '#f59e0b', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
                {time}
              </Text>
            </View>

            {/* Date & Site */}
            <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500' }}>
              {date}
            </Text>

            {/* GPS stats */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
              <Text style={{ color: '#475569', fontSize: 11 }}>
                📍 {item.distanceFromSite ?? '--'}m dari tapak
              </Text>
              <Text style={{ color: item.anomalyScore >= 30 ? '#f59e0b' : '#475569', fontSize: 11 }}>
                ⚡ Skor: {item.anomalyScore ?? 0}
              </Text>
            </View>
          </View>

          {/* Status Badge */}
          <StatusChip label={statusConfig.label} status={statusConfig.status} size="sm" />
        </View>
      </Card>
    );
  };

  // ======= Rendering States =======

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ color: '#64748b', marginTop: 12, fontSize: 13 }}>Memuatkan sejarah...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ color: '#f1f5f9', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 }}>
          Sejarah Kehadiran
        </Text>
        <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          {records.length > 0 ? `${records.length} rekod dijumpai` : 'Rekod clock-in dan clock-out anda'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 }}>
        {[
          { key: 'ALL' as FilterType, label: 'Semua', count: records.length },
          { key: 'CLOCK_IN' as FilterType, label: 'Masuk', count: records.filter(r => r.checkType === 'CLOCK_IN').length },
          { key: 'CLOCK_OUT' as FilterType, label: 'Keluar', count: records.filter(r => r.checkType === 'CLOCK_OUT').length },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filter === tab.key ? '#f59e0b' : '#1e293b',
              borderWidth: 1,
              borderColor: filter === tab.key ? '#f59e0b' : '#334155',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text
              style={{
                color: filter === tab.key ? '#0f172a' : '#94a3b8',
                fontSize: 12,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              {tab.label}
            </Text>
            <View style={{
              backgroundColor: filter === tab.key ? 'rgba(0,0,0,0.2)' : '#334155',
              borderRadius: 10,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}>
              <Text style={{ color: filter === tab.key ? '#0f172a' : '#64748b', fontSize: 10, fontWeight: '700' }}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error State */}
      {error && (
        <View style={{
          marginHorizontal: 20, marginBottom: 12, padding: 14,
          backgroundColor: '#1e293b', borderRadius: 12,
          borderWidth: 1, borderColor: '#ef4444', flexDirection: 'row', alignItems: 'center', gap: 10
        }}>
          <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
          <Text style={{ color: '#fca5a5', fontSize: 13, flex: 1 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchHistory()}>
            <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '700' }}>Cuba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      <FlatList
        data={filteredRecords}
        renderItem={renderItem}
        keyExtractor={(item) => item.attendanceId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            tintColor="#f59e0b"
            colors={['#f59e0b']}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="document-text-outline" size={48} color="#334155" />
            <Text style={{ color: '#475569', fontSize: 14, marginTop: 12 }}>
              {error ? 'Gagal memuatkan data' : 'Tiada rekod kehadiran'}
            </Text>
            {!error && (
              <Text style={{ color: '#334155', fontSize: 12, marginTop: 6, textAlign: 'center' }}>
                Rekod anda akan muncul di sini selepas Clock-In pertama
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
