import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import api from '../../services/api';
import { Product } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [bestProducts, setBestProducts] = useState<Product[]>([]);
  const [discountProducts, setDiscountProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const products = response.data.products || response.data;

      setBestProducts(products.slice(0, 10));

      // Filter discount products
      const now = new Date();
      const onSale = products.filter((p: Product) => {
        if (!p.discount_price || !p.discount_start || !p.discount_end) return false;
        return now >= new Date(p.discount_start) && now <= new Date(p.discount_end);
      }).slice(0, 6);

      setDiscountProducts(onSale);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const getDiscountPercent = (product: Product) => {
    if (!product.discount_price) return 0;
    return Math.round((1 - product.discount_price / product.price) * 100);
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.imageContainer}>
        {item.thumbnail_url ? (
          <Image
            source={{ uri: item.thumbnail_url }}
            style={styles.productImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        {item.discount_price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              {getDiscountPercent(item)}%
            </Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {item.vendor_name || '판매자'}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.discount_price ? (
          <View>
            <Text style={styles.discountPrice}>
              {item.discount_price.toLocaleString()}원
            </Text>
            <Text style={styles.originalPrice}>
              {item.price.toLocaleString()}원
            </Text>
          </View>
        ) : (
          <Text style={styles.price}>{item.price.toLocaleString()}원</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>쇼핑몰</Text>
        <Text style={styles.headerSubtitle}>AI 기반 스마트 쇼핑</Text>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>2025 WINTER</Text>
        <Text style={styles.bannerTitle}>NEW ARRIVAL</Text>
        <Text style={styles.bannerSubtitle}>최대 50% 할인</Text>
      </View>

      {/* Today's Deal */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>오늘의 특가</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>전체보기 ›</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={discountProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
        />
      </View>

      {/* Best Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>베스트 상품 TOP 10</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>전체보기 ›</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={bestProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productList}
        />
      </View>

      {/* Benefits */}
      <View style={styles.benefits}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🚚</Text>
          <Text style={styles.benefitTitle}>무료배송</Text>
          <Text style={styles.benefitDesc}>5만원 이상</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✓</Text>
          <Text style={styles.benefitTitle}>정품보장</Text>
          <Text style={styles.benefitDesc}>100% 공식인증</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>↺</Text>
          <Text style={styles.benefitTitle}>무료반품</Text>
          <Text style={styles.benefitDesc}>30일 이내</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>⭐</Text>
          <Text style={styles.benefitTitle}>적립금</Text>
          <Text style={styles.benefitDesc}>최대 5%</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[300],
    marginTop: SPACING.xs,
  },
  banner: {
    backgroundColor: COLORS.gray[800],
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  bannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[300],
    letterSpacing: 2,
  },
  bannerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginVertical: SPACING.sm,
  },
  bannerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[300],
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  seeAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
  productList: {
    paddingHorizontal: SPACING.md,
  },
  productCard: {
    width: 150,
    marginRight: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  placeholderImage: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.gray[400],
    fontSize: FONT_SIZES.sm,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: COLORS.secondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: SPACING.sm,
  },
  vendorName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  productName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginBottom: 8,
    height: 32,
  },
  price: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  discountPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  originalPrice: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.lg,
    backgroundColor: COLORS.gray[50],
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  benefitItem: {
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  benefitTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  benefitDesc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[600],
    marginTop: 2,
  },
});
