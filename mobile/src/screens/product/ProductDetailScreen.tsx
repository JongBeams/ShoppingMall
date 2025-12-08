import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import api from '../../services/api';
import { Product } from '../../types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants/config';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchProduct();
    checkWishlist();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('오류', '상품 정보를 불러오지 못했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      const wishlistItems = response.data.items || [];
      const isInWishlist = wishlistItems.some(
        (item: any) => item.product_id === productId
      );
      setIsWishlisted(isInWishlist);
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  const handleAddToCart = async () => {
    try {
      await api.post('/cart', {
        product_id: productId,
        quantity,
      });
      Alert.alert('성공', '장바구니에 추가되었습니다.', [
        { text: '계속 쇼핑', style: 'cancel' },
        {
          text: '장바구니 가기',
          onPress: () => navigation.navigate('Main'),
        },
      ]);
    } catch (error) {
      Alert.alert('오류', '장바구니 추가에 실패했습니다.');
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (isWishlisted) {
        // 찜하기 취소
        await api.delete(`/wishlist/${productId}`);
        setIsWishlisted(false);
        Alert.alert('알림', '찜 목록에서 제거되었습니다.');
      } else {
        // 찜하기 추가
        await api.post('/wishlist', { product_id: productId });
        setIsWishlisted(true);
        Alert.alert('성공', '찜 목록에 추가되었습니다.');
      }
    } catch (error) {
      console.error('Wishlist toggle failed:', error);
      Alert.alert('오류', '찜하기 처리에 실패했습니다.');
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  const discountPercent = product.discount_price
    ? Math.round((1 - product.discount_price / product.price) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.thumbnail_url ? (
            <Image
              source={{ uri: product.thumbnail_url }}
              style={styles.productImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color={COLORS.gray[400]} />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.vendorName}>{product.vendor_name || '판매자'}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Price */}
          {product.discount_price ? (
            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.discountPercent}>{discountPercent}%</Text>
                <Text style={styles.discountPrice}>
                  {product.discount_price.toLocaleString()}원
                </Text>
              </View>
              <Text style={styles.originalPrice}>
                {product.price.toLocaleString()}원
              </Text>
            </View>
          ) : (
            <Text style={styles.price}>{product.price.toLocaleString()}원</Text>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>수량</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>상품 설명</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            isWishlisted && styles.wishlistButtonActive,
          ]}
          onPress={handleToggleWishlist}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={isWishlisted ? COLORS.accent : COLORS.primary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
          <Text style={styles.cartButtonText}>장바구니 담기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.gray[100],
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: SPACING.lg,
  },
  vendorName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  productName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  priceContainer: {
    marginBottom: SPACING.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountPercent: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.danger,
    marginRight: SPACING.sm,
  },
  discountPrice: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.gray[200],
    marginBottom: SPACING.lg,
  },
  quantityLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 4,
  },
  quantityButton: {
    padding: SPACING.sm,
  },
  quantityText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    paddingHorizontal: SPACING.lg,
  },
  descriptionContainer: {
    marginTop: SPACING.md,
  },
  descriptionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  descriptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[700],
    lineHeight: 24,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.secondary,
  },
  wishlistButton: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  wishlistButtonActive: {
    backgroundColor: COLORS.accent + '20', // 20% opacity
    borderColor: COLORS.accent,
  },
  cartButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonText: {
    color: COLORS.secondary,
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
  },
});
